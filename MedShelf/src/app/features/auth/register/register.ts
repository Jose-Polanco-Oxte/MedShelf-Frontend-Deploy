import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { ApiService } from '../../../shared/services/api.service';
import { AuthService } from '../../../core/services/auth.service';

interface RegisterResponse {
  [key: string]: unknown;
}

@Component({
  selector: 'app-register',
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './register.html',
  styleUrl: './register.css',
})
export class Register {
  private authService = inject(AuthService);

  fullname: string = '';
  email: string = '';
  password: string = '';
  confirmPassword: string = '';
  isLoading: boolean = false;
  errorMessage: string = '';

  onSubmit() {
    if (!this.fullname || !this.email || !this.password || !this.confirmPassword) {
      this.errorMessage = 'Completa todos los campos.';
      return;
    }

    if (this.password !== this.confirmPassword) {
      this.errorMessage = 'Las contraseñas no coinciden.';
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';

    this.authService.register(this.fullname, this.email, this.password).subscribe({
      next: (response) => {
        console.log('Registro exitoso:', response);
        this.isLoading = false;
      },
      error: (error) => {
        this.isLoading = false;
        this.errorMessage =
          error?.error?.message ||
          error?.error?.detail ||
          'No se pudo completar el registro. Intenta de nuevo.';
      },
    });
  }
}
