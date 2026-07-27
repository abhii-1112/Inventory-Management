import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { CategoryService } from '../../../core/services/category.service';
import { Category } from '../../../core/models/category.model';

@Component({
  selector: 'app-category-list',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './category-list.html',
  styleUrl: './category-list.css',
})
export class CategoryList implements OnInit {
  categories = signal<Category[]>([]);
  loading = signal(false);
  errorMessage = signal('');

  constructor(private categoryService: CategoryService) {}

  ngOnInit(): void {
    this.loadCategories();
  }

  loadCategories(): void {
    this.loading.set(true);
    this.errorMessage.set('');

    this.categoryService.getAll().subscribe({
      next: (data) => {
        this.categories.set(data);
        this.loading.set(false);
      },
      error: (err) => {
        this.errorMessage.set('Failed to load categories. Is the backend running?');
        this.loading.set(false);
        console.error(err);
      },
    });
  }

  deleteCategory(id: string, name: string): void {
    const confirmed = confirm(`Delete category "${name}"? This cannot be undone.`);
    if (!confirmed) return;

    this.categoryService.delete(id).subscribe({
      next: () => {
        this.categories.update((current) => current.filter((c) => c.id !== id));
      },
      error: (err) => {
        alert(err.error?.message || 'Failed to delete category');
      },
    });
  }
}