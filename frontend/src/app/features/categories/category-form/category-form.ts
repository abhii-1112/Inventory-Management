import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { CategoryService } from '../../../core/services/category.service';

@Component({
  selector: 'app-category-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './category-form.html',
  styleUrl: './category-form.css',
})
export class CategoryForm implements OnInit {
  form: FormGroup;
  isEditMode = signal(false);
  categoryId: string | null = null;
  loading = signal(false);
  errorMessage = signal('');

  constructor(
    private fb: FormBuilder,
    private categoryService: CategoryService,
    private route: ActivatedRoute,
    private router: Router
  ) {
    this.form = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(2)]],
    });
  }

  ngOnInit(): void {
    this.categoryId = this.route.snapshot.paramMap.get('id');

    if (this.categoryId) {
      this.isEditMode.set(true);
      this.loadCategory(this.categoryId);
    }
  }

  loadCategory(id: string): void {
    this.loading.set(true);
    this.categoryService.getById(id).subscribe({
      next: (category) => {
        this.form.patchValue({ name: category.name });
        this.loading.set(false);
      },
      error: () => {
        this.errorMessage.set('Failed to load category');
        this.loading.set(false);
      },
    });
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const name = this.form.value.name;
    this.loading.set(true);
    this.errorMessage.set('');

    const request = this.isEditMode()
      ? this.categoryService.update(this.categoryId!, name)
      : this.categoryService.create(name);

    request.subscribe({
      next: () => {
        this.router.navigate(['/categories']);
      },
      error: (err) => {
        this.errorMessage.set(err.error?.message || 'Something went wrong');
        this.loading.set(false);
      },
    });
  }

  onCancel(): void {
    this.router.navigate(['/categories']);
  }
}