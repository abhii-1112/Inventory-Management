import { Category } from './category.model';

export interface Product {
  id: string;
  name: string;
  image: string | null;
  price: number;
  categoryId: string;
  category?: Category;
  createdAt?: string;
  updatedAt?: string;
}

export interface PaginatedProducts {
  data: Product[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}