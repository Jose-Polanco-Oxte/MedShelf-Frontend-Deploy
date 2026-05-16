import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule, Eye, EyeOff} from 'lucide-angular';
import { Router, RouterLink } from '@angular/router';
import { signal } from '@angular/core';
import { ApiService } from '../../../shared/services/api.service';
import { AuthService } from '../../../core/services/auth.service';
import { Loading } from "../../../shared/components/navbar/loading/loading";

interface LoginResponse {
  user?: unknown;
  [key: string]: unknown;
}

@Component({
  selector: 'app-login',
  imports: [CommonModule, FormsModule, RouterLink, LucideAngularModule, Loading],
  templateUrl: './login.html',
  styleUrl: './login.css',
})
export class Login {
  private authService = inject(AuthService);

  email = signal('');
  password = signal('');
  isLoading = signal(false);
  errorMessage = signal('');
  showPassword = signal(false);

  icons = {
    eye : Eye,
    eyeOff : EyeOff,
  };

  // Validar email
  validateEmail(): string {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(this.email())) {
      return 'Por favor ingresa un email válido.';
    }
    return '';
  }

  // Validar contraseña
  validatePassword(): string {
    if (!this.password() || this.password().length === 0) {
      return 'Por favor ingresa tu contraseña.';
    }
    if (this.password().length < 5) {
      return 'Contraseña inválida. Debe tener al menos 5 caracteres.';
    }
    return '';
  }

  onSubmit() {
    // Validar campos vacíos
    if (!this.email() || !this.password()) {
      this.errorMessage.set('Completa todos los campos.');
      return;
    }

    // Validar email
    const emailError = this.validateEmail();
    if (emailError) {
      this.errorMessage.set(emailError);
      return;
    }

    // Validar contraseña
    const passwordError = this.validatePassword();
    if (passwordError) {
      this.errorMessage.set(passwordError);
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set('');

    this.authService.login(this.email().trim(), this.password()).subscribe({
      next: (response) => {
        console.log('Inicio de sesión exitoso:', response);
        this.isLoading.set(false);
      },
      error: (error) => {
        this.isLoading.set(false);
        // Mostrar mensajes de error en español según el tipo de error
        if (error?.status === 401) {
          // Unauthorized - Credenciales inválidas
          this.errorMessage.set('Correo o contraseña incorrectos.');
        } else if (error?.status === 400) {
          // Bad Request
          this.errorMessage.set('Los datos ingresados no son válidos.');
        } else if (error?.status === 500) {
          // Error del servidor
          this.errorMessage.set('Error en el servidor. Intenta de nuevo más tarde.');
        } else {
          // Error desconocido
          this.errorMessage.set('No se pudo iniciar sesión. Intenta de nuevo.');
        }
        console.error('Error en inicio de sesión:', error);
      },
    });
  }

  togglePasswordVisibility() {
    this.showPassword.set(!this.showPassword());    
  }
}
