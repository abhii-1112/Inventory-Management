import { RequestHandler } from 'express';
import Product from '../models/product';
import Category from '../models/category';
import { Op } from 'sequelize';

const isValidUUID = (id: string): boolean => {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(id);
};

// CREATE
export const createProduct: RequestHandler = async (req, res) => {
  try {
    const { name, price, categoryId } = req.body;

    if (!name || !name.trim()) {
      res.status(400).json({ message: 'Product name is required' });
      return;
    }

    if (price === undefined || Number(price) < 0) {
      res.status(400).json({ message: 'Valid price is required' });
      return;
    }

    if (!categoryId || !isValidUUID(categoryId)) {
      res.status(400).json({ message: 'Valid categoryId is required' });
      return;
    }

    const category = await Category.findByPk(categoryId);
    if (!category) {
      res.status(404).json({ message: 'Category not found' });
      return;
    }

    // req.file is populated by multer if an image was uploaded
    const imagePath = req.file ? `/uploads/${req.file.filename}` : null;

    const product = await Product.create({
      name: name.trim(),
      price: Number(price),
      categoryId,
      image: imagePath,
    });

    res.status(201).json(product);
  } catch (error: any) {
    res.status(500).json({ message: 'Something went wrong', error: error.message });
  }
};

// READ ALL (basic version — we'll upgrade this with pagination/sort/search in Step 6)
export const getProducts: RequestHandler = async (req, res) => {
  try {
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.max(1, Number(req.query.limit) || 10);
    const offset = (page - 1) * limit;
    const sortOrder = req.query.sortOrder === 'desc' ? 'DESC' : 'ASC';
    const allowedSortFields = ['price', 'name', 'createdAt'];
    const sortBy = allowedSortFields.includes(req.query.sortBy as string)
      ? (req.query.sortBy as string)
      : 'createdAt';

    const search = (req.query.search as string) || '';
    const categoryName = (req.query.category as string) || '';

    const whereClause: any = {};
    if (search) {
      whereClause.name = { [Op.iLike]: `%${search}%` }; // case-insensitive partial match (Postgres-specific)
    }

    const includeClause: any = {
      model: Category,
      as: 'category',
      attributes: ['id', 'name'],
    };

    if (categoryName) {
      includeClause.where = { name: { [Op.iLike]: `%${categoryName}%` } };
    }
    const { count, rows } = await Product.findAndCountAll({
      where: whereClause,
      include: [includeClause],
      order: [[sortBy, sortOrder]],
      limit,
      offset,
      distinct: true, // required for accurate count when using include (avoids inflated count from joins)
    });
    res.status(200).json({
      data: rows,
      pagination: {
        total: count,
        page,
        limit,
        totalPages: Math.ceil(count / limit),
      },
    });

} catch (error: any) {
    res.status(500).json({ message: 'Something went wrong', error: error.message });
  }
};

// READ ONE
export const getProductById: RequestHandler = async (req, res) => {
  try {
    const id = req.params.id as string;

    if (!isValidUUID(id)) {
      res.status(400).json({ message: 'Invalid product ID format' });
      return;
    }

    const product = await Product.findByPk(id, {
      include: [{ model: Category, as: 'category', attributes: ['id', 'name'] }],
    });

    if (!product) {
      res.status(404).json({ message: 'Product not found' });
      return;
    }

    res.status(200).json(product);
  } catch (error: any) {
    res.status(500).json({ message: 'Something went wrong', error: error.message });
  }
};

// UPDATE
export const updateProduct: RequestHandler = async (req, res) => {
  try {
    const id = req.params.id as string;

    if (!isValidUUID(id)) {
      res.status(400).json({ message: 'Invalid product ID format' });
      return;
    }

    const product = await Product.findByPk(id);
    if (!product) {
      res.status(404).json({ message: 'Product not found' });
      return;
    }

    const { name, price, categoryId } = req.body;

    if (categoryId) {
      if (!isValidUUID(categoryId)) {
        res.status(400).json({ message: 'Invalid categoryId format' });
        return;
      }
      const category = await Category.findByPk(categoryId);
      if (!category) {
        res.status(404).json({ message: 'Category not found' });
        return;
      }
      product.categoryId = categoryId;
    }

    if (name && name.trim()) product.name = name.trim();
    if (price !== undefined && Number(price) >= 0) product.price = Number(price);
    if (req.file) product.image = `/uploads/${req.file.filename}`;

    await product.save();
    res.status(200).json(product);
  } catch (error: any) {
    res.status(500).json({ message: 'Something went wrong', error: error.message });
  }
};

// DELETE
export const deleteProduct: RequestHandler = async (req, res) => {
  try {
    const id = req.params.id as string;

    if (!isValidUUID(id)) {
      res.status(400).json({ message: 'Invalid product ID format' });
      return;
    }

    const product = await Product.findByPk(id);
    if (!product) {
      res.status(404).json({ message: 'Product not found' });
      return;
    }

    await product.destroy();
    res.status(200).json({ message: 'Product deleted successfully' });
  } catch (error: any) {
    res.status(500).json({ message: 'Something went wrong', error: error.message });
  }
};