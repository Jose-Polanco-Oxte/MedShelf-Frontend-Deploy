import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule, Eye, EyeOff } from 'lucide-angular';
import { Router, RouterLink } from '@angular/router';
import { signal } from '@angular/core';
import { ApiService } from '../../../shared/services/api.service';
import { AuthService } from '../../../core/services/auth.service';
import { Loading } from "../../../shared/components/navbar/loading/loading";

interface RegisterResponse {
  [key: string]: unknown;
}

@Component({
  selector: 'app-register',
  imports: [CommonModule, FormsModule, RouterLink, LucideAngularModule, Loading],
  templateUrl: './register.html',
  styleUrl: './register.css',
})
export class Register {
  private authService = inject(AuthService);
  private apiService = inject(ApiService);
  private router = inject(Router);

  fullname = signal('');
  email = signal('');
  password = signal('');
  confirmPassword = signal('');
  isLoading = signal(false);
  errorMessage = signal('');
  showPassword = signal(false);
  showConfirmPassword = signal(false);

  icons = {
    eye: Eye,
    eyeOff: EyeOff,
  };

  // Validar que las contraseñas coincidan
  passwordsMatch(): boolean {
    if (!this.password() || !this.confirmPassword()) {
      return true; // No mostrar error si está vacío
    }
    return this.password() === this.confirmPassword();
  }

  // Obtener mensaje de error de contraseña
  getPasswordErrorMessage(): string {
    if (this.password() && this.confirmPassword() && this.password() !== this.confirmPassword()) {
      return 'Las contraseñas no coinciden';
    }
    return '';
  }

  togglePasswordVisibility() {
    this.showPassword.set(!this.showPassword());
  }

  toggleConfirmPasswordVisibility() {
    this.showConfirmPassword.set(!this.showConfirmPassword());
  }

  // Validar email
  validateEmail(): string {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(this.email())) {
      return 'Por favor ingresa un email válido.';
    }
    return '';
  }

  // Validar nombre completo
  validateFullname(): string {
    if (this.fullname().trim().length < 3) {
      return 'El nombre debe tener al menos 3 caracteres.';
    }
    if (this.fullname().trim().length > 100) {
      return 'El nombre no puede exceder 100 caracteres.';
    }
    if (!/^[a-zA-ZáéíóúñÁÉÍÓÚÑ\s]+$/.test(this.fullname())) {
      return 'El nombre solo puede contener letras y espacios.';
    }
    return '';
  }

  // Validar contraseña según los requisitos del frontend
  validatePassword(): string {
    if (this.password().length < 5) {
      return 'La contraseña debe tener al menos 5 caracteres.';
    }
    
    if (this.password().length > 50) {
      return 'La contraseña no puede exceder 50 caracteres.';
    }
    
    // Verificar que contenga al menos una letra
    if (!/[a-zA-Z]/.test(this.password())) {
      return 'La contraseña debe contener al menos una letra.';
    }
    
    // Verificar que contenga al menos una mayúscula
    if (!/[A-Z]/.test(this.password())) {
      return 'La contraseña debe contener al menos una letra mayúscula.';
    }
    
    return '';
  }

  onSubmit() {
    // Validar campos vacíos
    if (!this.fullname() || !this.email() || !this.password() || !this.confirmPassword()) {
      this.errorMessage.set('Completa todos los campos.');
      return;
    }

    // Validar nombre completo
    const fullnameError = this.validateFullname();
    if (fullnameError) {
      this.errorMessage.set(fullnameError);
      return;
    }

    // Validar email
    const emailError = this.validateEmail();
    if (emailError) {
      this.errorMessage.set(emailError);
      return;
    }

    // Validar contraseña (requisitos del frontend)
    const passwordError = this.validatePassword();
    if (passwordError) {
      this.errorMessage.set(passwordError);
      return;
    }

    // Validar que las contraseñas coincidan
    if (this.password() !== this.confirmPassword()) {
      this.errorMessage.set('Las contraseñas no coinciden.');
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set('');

    // Registrar usuario - El backend valida como protección
    this.authService.register(this.fullname().trim(), this.email().trim(), this.password()).subscribe({
      next: (response) => {
        console.log('Registro exitoso:', response);
        
        // Crear perfil automáticamente con el nombre del usuario registrado
        const profileData = {
          name: this.fullname().trim(),
          birthDate: null,
          allergies: []
        };
        
        this.apiService.post('/profiles', profileData).subscribe({
          next: (profileResponse) => {
            console.log('Perfil creado automáticamente:', profileResponse);
            this.isLoading.set(false);
            // Navegar al componente de éxito
            this.router.navigate(['/successful-registration']);
          },
          error: (profileError) => {
            console.error('Error al crear perfil automático:', profileError);
            console.error('Detalles del error completos:', {
              status: profileError?.status,
              statusText: profileError?.statusText,
              errorBody: profileError?.error,
              message: profileError?.message,
            });
            this.isLoading.set(false);
            // Navegar igual aunque falle la creación del perfil
            this.router.navigate(['/successful-registration']);
          },
        });
      },
      error: (error) => {
        this.isLoading.set(false);
        // Mostrar mensajes de error en español según el tipo de error
        if (error?.status === 422) {
          // Unprocessable Entity - Errores de validación

          // Analizar errores específicos del backend
          if (error?.error?.errors) {
            const backendErrors = error.error.errors;
            if (backendErrors.email) {
              this.errorMessage.set('Este correo ya está registrado.');
            } else if (backendErrors.password) {
              this.errorMessage.set('La contraseña no cumple con los requisitos.');
            } else {
              this.errorMessage.set('Los datos ingresados no son válidos.');
            }
          }  
        } else if (error?.status === 409) {
          // Conflicto - recurso duplicado (probablemente correo duplicado)
          this.errorMessage.set('Este correo ya está registrado.');
        } else if (error?.status === 400) {
          // Bad Request
          this.errorMessage.set('Los datos ingresados no son válidos.');
        } else if (error?.status === 500) {
          // Error del servidor
          this.errorMessage.set('Error en el servidor. Intenta de nuevo más tarde.');
        } else {
          // Error desconocido
          this.errorMessage.set('No se pudo completar el registro. Intenta de nuevo.');
        }
        console.error('Error en registro:', error);
      },
    });
  }
}

