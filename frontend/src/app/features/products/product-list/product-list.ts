import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { debounceTime, Subject } from 'rxjs';
import { ProductService } from '../../../core/services/product.service';
import { Product } from '../../../core/models/product.model';
import { environment } from '../../../../environments/environment';

@Component({
  selector: 'app-product-list',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  templateUrl: './product-list.html',
  styleUrl: './product-list.css',
})
export class ProductList implements OnInit {
  products = signal<Product[]>([]);
  loading = signal(false);
  errorMessage = signal('');

  page = signal(1);
  limit = 10;
  totalPages = signal(1);
  total = signal(0);

  sortBy = signal('createdAt');
  sortOrder = signal<'asc' | 'desc'>('desc');
  search = signal('');
  categoryFilter = signal('');

  mediaBaseUrl = environment.apiUrl.replace('/api', ''); // for building full image URLs

  private searchSubject = new Subject<string>();

  constructor(private productService: ProductService) {
    // debounce search input so we don't fire an API call on every keystroke
    this.searchSubject.pipe(debounceTime(400)).subscribe((value) => {
      this.search.set(value);
      this.page.set(1);
      this.loadProducts();
    });
  }

  ngOnInit(): void {
    this.loadProducts();
  }

  onSearchInput(value: string): void {
    this.searchSubject.next(value);
  }

  loadProducts(): void {
    this.loading.set(true);
    this.errorMessage.set('');

    this.productService
      .getAll({
        page: this.page(),
        limit: this.limit,
        sortBy: this.sortBy(),
        sortOrder: this.sortOrder(),
        search: this.search(),
        category: this.categoryFilter(),
      })
      .subscribe({
        next: (res) => {
          this.products.set(res.data);
          this.totalPages.set(res.pagination.totalPages);
          this.total.set(res.pagination.total);
          this.loading.set(false);
        },
        error: (err) => {
          this.errorMessage.set('Failed to load products. Is the backend running?');
          this.loading.set(false);
          console.error(err);
        },
      });
  }

  toggleSort(field: string): void {
    if (this.sortBy() === field) {
      this.sortOrder.set(this.sortOrder() === 'asc' ? 'desc' : 'asc');
    } else {
      this.sortBy.set(field);
      this.sortOrder.set('asc');
    }
    this.loadProducts();
  }

  goToPage(newPage: number): void {
    if (newPage < 1 || newPage > this.totalPages()) return;
    this.page.set(newPage);
    this.loadProducts();
  }

  deleteProduct(id: string, name: string): void {
    const confirmed = confirm(`Delete product "${name}"?`);
    if (!confirmed) return;

    this.productService.delete(id).subscribe({
      next: () => this.loadProducts(), // simplest to just reload the current page
      error: (err) => alert(err.error?.message || 'Failed to delete product'),
    });
  }
}