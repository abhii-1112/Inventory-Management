import { RequestHandler } from 'express';
import fs from 'fs';
import csv from 'csv-parser';
import * as XLSX from 'xlsx';
import Product from '../models/product';
import Category from '../models/category';
import UploadJob from '../models/uploadjobs';

// --- Helper: parse CSV file into an array of row objects ---
const parseCSV = (filePath: string): Promise<any[]> => {
  return new Promise((resolve, reject) => {
    const results: any[] = [];
    fs.createReadStream(filePath)
      .pipe(csv())
      .on('data', (row) => results.push(row))
      .on('end', () => resolve(results))
      .on('error', (err) => reject(err));
  });
};

// --- Helper: parse Excel file into an array of row objects ---
const parseExcel = (filePath: string): any[] => {
  const workbook = XLSX.readFile(filePath);
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];
  return XLSX.utils.sheet_to_json(sheet);
};

// --- The actual background processing function ---
// Note: this is NOT awaited by the route handler — it runs independently
async function processUploadJob(jobId: string, filePath: string, fileExt: string) {
  try {
    await UploadJob.update({ status: 'processing' }, { where: { id: jobId } });

    // 1. Parse the file (expects columns: name, price, category)
    const rows = fileExt === '.csv' ? await parseCSV(filePath) : parseExcel(filePath);

    await UploadJob.update({ totalRows: rows.length }, { where: { id: jobId } });

    // 2. Pre-fetch all categories once, so we're not querying the DB per-row (huge perf win for large files)
    const categories = await Category.findAll();
    const categoryMap = new Map(categories.map((c) => [c.name.toLowerCase(), c.id]));

    const errors: string[] = [];
    const validProducts: any[] = [];

    rows.forEach((row, index) => {
      const rowNum = index + 2; // +2 because row 1 is the header, and arrays are 0-indexed
      const name = row.name?.toString().trim();
      const price = Number(row.price);
      const categoryName = row.category?.toString().trim().toLowerCase();

      if (!name) {
        errors.push(`Row ${rowNum}: missing product name`);
        return;
      }
      if (isNaN(price) || price < 0) {
        errors.push(`Row ${rowNum}: invalid price "${row.price}"`);
        return;
      }
      const categoryId = categoryMap.get(categoryName);
      if (!categoryId) {
        errors.push(`Row ${rowNum}: category "${row.category}" not found`);
        return;
      }

      validProducts.push({ name, price, categoryId });
    });

    // 3. Bulk insert valid rows in chunks — much faster than inserting one at a time,
    //    and chunking avoids sending one massive query for extremely large files
    const CHUNK_SIZE = 500;
    let processedCount = 0;

    for (let i = 0; i < validProducts.length; i += CHUNK_SIZE) {
      const chunk = validProducts.slice(i, i + CHUNK_SIZE);
      await Product.bulkCreate(chunk);
      processedCount += chunk.length;

      // update progress after each chunk so the client polling for status sees live progress
      await UploadJob.update({ processedRows: processedCount }, { where: { id: jobId } });
    }

    // 4. Mark job as completed
    await UploadJob.update(
      {
        status: 'completed',
        processedRows: validProducts.length,
        failedRows: errors.length,
        errors,
      },
      { where: { id: jobId } }
    );

    // 5. Clean up the uploaded file — we don't need to keep it after processing
    fs.unlink(filePath, () => {});
  } catch (error: any) {
    await UploadJob.update(
      { status: 'failed', errors: [error.message] },
      { where: { id: jobId } }
    );
  }
}

// --- Route handler: accepts the file, kicks off background processing, responds immediately ---
export const bulkUploadProducts: RequestHandler = async (req, res) => {
  try {
    if (!req.file) {
      res.status(400).json({ message: 'No file uploaded' });
      return;
    }

    const job = await UploadJob.create({ status: 'pending' });

    const fileExt = req.file.originalname.slice(req.file.originalname.lastIndexOf('.')).toLowerCase();

    // Intentionally NOT awaited — this lets processUploadJob run in the background
    // while we respond to the client right away below.
    processUploadJob(job.id, req.file.path, fileExt);

    res.status(202).json({
      message: 'File accepted, processing started',
      jobId: job.id,
      statusUrl: `/api/upload-jobs/${job.id}`,
    });
  } catch (error: any) {
    res.status(500).json({ message: 'Something went wrong', error: error.message });
  }
};

// --- Route handler: check job status ---
export const getUploadJobStatus: RequestHandler = async (req, res) => {
  try {
    const job = await UploadJob.findByPk(req.params.jobId as string);

    if (!job) {
      res.status(404).json({ message: 'Job not found' });
      return;
    }

    res.status(200).json(job);
  } catch (error: any) {
    res.status(500).json({ message: 'Something went wrong', error: error.message });
  }
};