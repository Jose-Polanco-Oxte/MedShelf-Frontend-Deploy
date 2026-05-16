import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { ApiService } from '../../../shared/services/api.service';
import { AuthService } from '../../../core/services/auth.service';

interface LoginResponse {
  user?: unknown;
  [key: string]: unknown;
}

@Component({
  selector: 'app-login',
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './login.html',
  styleUrl: './login.css',
})
export class Login {
  private authService = inject(AuthService);

  email: string = '';
  password: string = '';
  isLoading: boolean = false;
  errorMessage: string = '';

  onSubmit() {
    if (!this.email || !this.password) {
      this.errorMessage = 'Ingresa correo y contraseña.';
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';

    this.authService.login(this.email.trim(), this.password).subscribe({
      next: (response) => {
        this.isLoading = false;
      },
      error: (error) => {
        this.isLoading = false;
        this.errorMessage =
          error?.error?.message ||
          error?.error?.detail ||
          'No se pudo iniciar sesión. Verifica tus credenciales.';
        console.error('Error de inicio de sesión:', error);
      },
    });
  }
}
