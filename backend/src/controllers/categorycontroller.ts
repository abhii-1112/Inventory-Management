import { RequestHandler } from 'express';
import Category from '../models/category';

const isValidUUID = (id: string): boolean => {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(id);
};

// CREATE
export const createCategory: RequestHandler = async (req, res) => {
  try {
    const { name } = req.body;

    if (!name || !name.trim()) {
      res.status(400).json({ message: 'Category name is required' });
      return;
    }

    const category = await Category.create({ name: name.trim() });
    res.status(201).json(category);
  } catch (error: any) {
    if (error.name === 'SequelizeUniqueConstraintError') {
      res.status(409).json({ message: 'Category already exists' });
      return;
    }
    res.status(500).json({ message: 'Something went wrong', error: error.message });
  }
};

// READ ALL
export const getCategories: RequestHandler = async (req, res) => {
  try {
    const categories = await Category.findAll({
      order: [['createdAt', 'DESC']], // newest first
    });
    res.status(200).json(categories);
  } catch (error: any) {
    res.status(500).json({ message: 'Something went wrong', error: error.message });
  }
};

// READ ONE
export const getCategoryById: RequestHandler = async (req, res) => {
  try {
    const id = req.params.id as string;

    if (!isValidUUID(id)) {
      res.status(400).json({ message: 'Invalid category ID format' });
      return;
    }

    const category = await Category.findByPk(id);

    if (!category) {
      res.status(404).json({ message: 'Category not found' });
      return;
    }

    res.status(200).json(category);
  } catch (error: any) {
    res.status(500).json({ message: 'Something went wrong', error: error.message });
  }
};

// UPDATE
export const updateCategory: RequestHandler = async (req, res) => {
  try {
    const id = req.params.id as string;

    if (!isValidUUID(id)) {
      res.status(400).json({ message: 'Invalid category ID format' });
      return;
    }

    const category = await Category.findByPk(id);

    if (!category) {
      res.status(404).json({ message: 'Category not found' });
      return;
    }

    const { name } = req.body;
    if (name && name.trim()) category.name = name.trim();

    await category.save();
    res.status(200).json(category);
  } catch (error: any) {
    if (error.name === 'SequelizeUniqueConstraintError') {
      res.status(409).json({ message: 'Category already exists' });
      return;
    }
    res.status(500).json({ message: 'Something went wrong', error: error.message });
  }
};

// DELETE
export const deleteCategory: RequestHandler = async (req, res) => {
  try {
    const id = req.params.id as string;

    if (!isValidUUID(id)) {
      res.status(400).json({ message: 'Invalid category ID format' });
      return;
    }

    const category = await Category.findByPk(id);

    if (!category) {
      res.status(404).json({ message: 'Category not found' });
      return;
    }

    await category.destroy();
    res.status(200).json({ message: 'Category deleted successfully' });
  } catch (error: any) {
    res.status(500).json({ message: 'Something went wrong', error: error.message });
  }
};