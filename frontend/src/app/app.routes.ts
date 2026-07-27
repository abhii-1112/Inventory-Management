import { Routes } from '@angular/router';
import { CategoryList } from './features/categories/category-list/category-list';
import { CategoryForm } from './features/categories/category-form/category-form';
import { ProductList } from './features/products/product-list/product-list';
import { ProductForm } from './features/products/product-form/product-form';
import { BulkUploadPage } from './features/bulk-upload/bulk-upload-page/bulk-upload-page';
import { ReportsPage } from './features/reports/reports-page/reports-page';
import { UserList } from './features/users/user-list/user-list';
import { UserForm } from './features/users/user-form/user-form';

export const routes: Routes = [
  { path: '', redirectTo: 'products', pathMatch: 'full' },
  { path: 'categories', component: CategoryList },
  { path: 'categories/new', component: CategoryForm },
  { path: 'categories/:id/edit', component: CategoryForm },
  { path: 'products', component: ProductList },
  { path: 'products/new', component: ProductForm },
  { path: 'products/:id/edit', component: ProductForm },
  { path: 'bulk-upload', component: BulkUploadPage },
  { path: 'reports', component: ReportsPage },
  { path: 'users', component: UserList },
  { path: 'users/new', component: UserForm },
  { path: 'users/:id/edit', component: UserForm },
];