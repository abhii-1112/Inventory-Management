import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { UserService } from '../../../core/services/user.service';
import { User } from '../../../core/models/user.model';

@Component({
  selector: 'app-user-list',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './user-list.html',
  styleUrl: './user-list.css',
})
export class UserList implements OnInit {
  users = signal<User[]>([]);
  loading = signal(false);
  errorMessage = signal('');

  constructor(private userService: UserService) {}

  ngOnInit(): void {
    this.loadUsers();
  }

  loadUsers(): void {
    this.loading.set(true);
    this.userService.getAll().subscribe({
      next: (data) => {
        this.users.set(data);
        this.loading.set(false);
      },
      error: () => {
        this.errorMessage.set('Failed to load users');
        this.loading.set(false);
      },
    });
  }

  deleteUser(id: string, email: string): void {
    const confirmed = confirm(`Delete user "${email}"?`);
    if (!confirmed) return;

    this.userService.delete(id).subscribe({
      next: () => this.users.update((current) => current.filter((u) => u.id !== id)),
      error: (err) => alert(err.error?.message || 'Failed to delete user'),
    });
  }
}