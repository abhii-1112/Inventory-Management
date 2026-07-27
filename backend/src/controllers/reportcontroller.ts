import { RequestHandler } from 'express';
import fs from 'fs';
import path from 'path';
import * as XLSX from 'xlsx';
import { Parser } from 'json2csv';
import Product from '../models/product';
import Category from '../models/category';
import ReportJob from '../models/reportjob';

// --- Background job: fetch all products, write to file, update job status ---
async function generateReport(jobId: string, format: 'csv' | 'xlsx') {
  try {
    await ReportJob.update({ status: 'processing' }, { where: { id: jobId } });

    // Fetch in batches instead of one giant findAll() — keeps memory usage sane
    // even if the product table has hundreds of thousands of rows.
    const BATCH_SIZE = 1000;
    let offset = 0;
    const allRows: any[] = [];

    while (true) {
      const batch = await Product.findAll({
        include: [{ model: Category, as: 'category', attributes: ['name'] }],
        limit: BATCH_SIZE,
        offset,
        order: [['createdAt', 'ASC']],
      });

      if (batch.length === 0) break;

      batch.forEach((p: any) => {
        allRows.push({
          id: p.id,
          name: p.name,
          price: p.price,
          category: p.category ? p.category.name : 'N/A',
          createdAt: p.createdAt,
        });
      });

      offset += BATCH_SIZE;
      if (batch.length < BATCH_SIZE) break; // last page reached
    }

    const fileName = `product-report-${jobId}.${format}`;
    const filePath = path.join(__dirname, '../reports', fileName);

    if (format === 'csv') {
      const parser = new Parser({ fields: ['id', 'name', 'price', 'category', 'createdAt'] });
      const csvContent = parser.parse(allRows);
      fs.writeFileSync(filePath, csvContent);
    } else {
      const worksheet = XLSX.utils.json_to_sheet(allRows);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Products');
      XLSX.writeFile(workbook, filePath);
    }

    await ReportJob.update(
      { status: 'completed', filePath: fileName },
      { where: { id: jobId } }
    );
  } catch (error: any) {
    await ReportJob.update(
      { status: 'failed', error: error.message },
      { where: { id: jobId } }
    );
  }
}

// --- Route: request a report ---
export const requestReport: RequestHandler = async (req, res) => {
  try {
    const format = (req.query.format as string) === 'xlsx' ? 'xlsx' : 'csv';

    const job = await ReportJob.create({
        format,
        status: 'processing'
    });

    // Not awaited — runs in background, response returns immediately
    generateReport(job.id, format);

    res.status(202).json({
      message: 'Report generation started',
      jobId: job.id,
      statusUrl: `/api/reports/${job.id}`,
    });
  } catch (error: any) {
    res.status(500).json({ message: 'Something went wrong', error: error.message });
  }
};

// --- Route: check status ---
export const getReportStatus: RequestHandler = async (req, res) => {
  try {
    const job = await ReportJob.findByPk(req.params.jobId as string);

    if (!job) {
      res.status(404).json({ message: 'Report job not found' });
      return;
    }

    res.status(200).json(job);
  } catch (error: any) {
    res.status(500).json({ message: 'Something went wrong', error: error.message });
  }
};

// --- Route: download the finished file ---
export const downloadReport: RequestHandler = async (req, res) => {
  try {
    const job = await ReportJob.findByPk(req.params.jobId as string);

    if (!job) {
      res.status(404).json({ message: 'Report job not found' });
      return;
    }

    if (job.status !== 'completed' || !job.filePath) {
      res.status(400).json({ message: `Report is not ready yet (status: ${job.status})` });
      return;
    }

    const fullPath = path.join(__dirname, '../reports', job.filePath);

    if (!fs.existsSync(fullPath)) {
      res.status(404).json({ message: 'Report file not found on server' });
      return;
    }

    // res.download() sets the right headers and streams the file to the client
    res.download(fullPath, job.filePath);
  } catch (error: any) {
    res.status(500).json({ message: 'Something went wrong', error: error.message });
  }
};