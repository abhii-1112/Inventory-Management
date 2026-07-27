import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ProductService } from '../../../core/services/product.service';
import { CategoryService } from '../../../core/services/category.service';
import { Category } from '../../../core/models/category.model';
import { environment } from '../../../../environments/environment';

@Component({
  selector: 'app-product-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './product-form.html',
  styleUrl: './product-form.css',
})
export class ProductForm implements OnInit {
  form: FormGroup;
  categories = signal<Category[]>([]);
  isEditMode = signal(false);
  productId: string | null = null;
  loading = signal(false);
  errorMessage = signal('');

  selectedFile: File | null = null;
  imagePreview = signal<string | null>(null); // existing image URL when editing
  mediaBaseUrl = environment.apiUrl.replace('/api', '');

  constructor(
    private fb: FormBuilder,
    private productService: ProductService,
    private categoryService: CategoryService,
    private route: ActivatedRoute,
    private router: Router
  ) {
    this.form = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(2)]],
      price: ['', [Validators.required, Validators.min(0)]],
      categoryId: ['', Validators.required],
    });
  }

  ngOnInit(): void {
    this.loadCategories();

    this.productId = this.route.snapshot.paramMap.get('id');
    if (this.productId) {
      this.isEditMode.set(true);
      this.loadProduct(this.productId);
    }
  }

  loadCategories(): void {
    this.categoryService.getAll().subscribe({
      next: (data) => this.categories.set(data),
      error: (err) => console.error('Failed to load categories', err),
    });
  }

  loadProduct(id: string): void {
    this.loading.set(true);
    this.productService.getById(id).subscribe({
      next: (product) => {
        this.form.patchValue({
          name: product.name,
          price: product.price,
          categoryId: product.categoryId,
        });
        if (product.image) {
          this.imagePreview.set(this.mediaBaseUrl + product.image);
        }
        this.loading.set(false);
      },
      error: () => {
        this.errorMessage.set('Failed to load product');
        this.loading.set(false);
      },
    });
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      this.selectedFile = input.files[0];
      // show a local preview immediately, before uploading
      const reader = new FileReader();
      reader.onload = () => this.imagePreview.set(reader.result as string);
      reader.readAsDataURL(this.selectedFile);
    }
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const formData = new FormData();
    formData.append('name', this.form.value.name);
    formData.append('price', this.form.value.price);
    formData.append('categoryId', this.form.value.categoryId);
    if (this.selectedFile) {
      formData.append('image', this.selectedFile);
    }

    this.loading.set(true);
    this.errorMessage.set('');

    const request = this.isEditMode()
      ? this.productService.update(this.productId!, formData)
      : this.productService.create(formData);

    request.subscribe({
      next: () => this.router.navigate(['/products']),
      error: (err) => {
        this.errorMessage.set(err.error?.message || 'Something went wrong');
        this.loading.set(false);
      },
    });
  }

  onCancel(): void {
    this.router.navigate(['/products']);
  }
}