import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { UserService } from '../../../core/services/user.service';

@Component({
  selector: 'app-user-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './user-form.html',
  styleUrl: './user-form.css',
})
export class UserForm implements OnInit {
  form: FormGroup;
  isEditMode = signal(false);
  userId: string | null = null;
  loading = signal(false);
  errorMessage = signal('');

  constructor(
    private fb: FormBuilder,
    private userService: UserService,
    private route: ActivatedRoute,
    private router: Router
  ) {
    this.form = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: [''], // required only on create — validated manually below
    });
  }

  ngOnInit(): void {
    this.userId = this.route.snapshot.paramMap.get('id');
    if (this.userId) {
      this.isEditMode.set(true);
      this.form.get('email')?.disable(); // keep it simple: email not editable in edit mode (optional choice)
      this.loadUser(this.userId);
    } else {
      this.form.get('password')?.setValidators([Validators.required, Validators.minLength(6)]);
    }
  }

  loadUser(id: string): void {
    this.loading.set(true);
    this.userService.getById(id).subscribe({
      next: (user) => {
        this.form.patchValue({ email: user.email });
        this.loading.set(false);
      },
      error: () => {
        this.errorMessage.set('Failed to load user');
        this.loading.set(false);
      },
    });
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const email = this.form.getRawValue().email; // getRawValue includes disabled fields
    const password = this.form.value.password;

    this.loading.set(true);
    this.errorMessage.set('');

    const request = this.isEditMode()
      ? this.userService.update(this.userId!, email, password || undefined)
      : this.userService.create(email, password);

    request.subscribe({
      next: () => this.router.navigate(['/users']),
      error: (err) => {
        this.errorMessage.set(err.error?.message || 'Something went wrong');
        this.loading.set(false);
      },
    });
  }

  onCancel(): void {
    this.router.navigate(['/users']);
  }
}