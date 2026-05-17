import { Component, inject, computed, ViewChild, ElementRef } from '@angular/core';
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

  @ViewChild('birthDateInput') birthDateInput!: ElementRef<HTMLInputElement>;

  fullname = signal('');
  email = signal('');
  birthDate = signal('');
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

  // Fecha máxima permitida: hace exactamente 18 años
  maxBirthDate = computed(() => {
    const today = new Date();
    today.setFullYear(today.getFullYear() - 18);
    return today.toISOString().split('T')[0];
  });

  openDatePicker() {
    if (!this.isLoading()) {
      this.birthDateInput?.nativeElement?.showPicker();
    }
  }

  // Validar que las contraseñas coincidan
  passwordsMatch(): boolean {
    if (!this.password() || !this.confirmPassword()) {
      return true;
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

  // Validar fecha de nacimiento
  validateBirthDate(): string {
    if (!this.birthDate()) {
      return 'La fecha de nacimiento es requerida.';
    }

    const birth = new Date(this.birthDate());
    const today = new Date();
    const age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();

    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      const actualAge = age - 1;
      if (actualAge < 18) {
        return 'Debes ser mayor de 18 años para registrarte.';
      }
    } else {
      if (age < 18) {
        return 'Debes ser mayor de 18 años para registrarte.';
      }
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

    if (!/[a-zA-Z]/.test(this.password())) {
      return 'La contraseña debe contener al menos una letra.';
    }

    if (!/[A-Z]/.test(this.password())) {
      return 'La contraseña debe contener al menos una letra mayúscula.';
    }

    return '';
  }

  onSubmit() {
    if (!this.fullname() || !this.email() || !this.birthDate() || !this.password() || !this.confirmPassword()) {
      this.errorMessage.set('Completa todos los campos.');
      return;
    }

    const fullnameError = this.validateFullname();
    if (fullnameError) {
      this.errorMessage.set(fullnameError);
      return;
    }

    const emailError = this.validateEmail();
    if (emailError) {
      this.errorMessage.set(emailError);
      return;
    }

    const birthDateError = this.validateBirthDate();
    if (birthDateError) {
      this.errorMessage.set(birthDateError);
      return;
    }

    const passwordError = this.validatePassword();
    if (passwordError) {
      this.errorMessage.set(passwordError);
      return;
    }

    if (this.password() !== this.confirmPassword()) {
      this.errorMessage.set('Las contraseñas no coinciden.');
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set('');

    this.authService.register(this.fullname().trim(), this.email().trim(), this.password()).subscribe({
      next: (response) => {
        console.log('Registro exitoso:', response);

        const profileData = {
          name: this.fullname().trim(),
          birthDate: this.birthDate()
        };

        this.apiService.post('/profiles', profileData).subscribe({
          next: (profileResponse) => {
            console.log('Perfil creado automáticamente:', profileResponse);
            this.isLoading.set(false);
            this.router.navigate(['/successful-registration']);
          },
          error: (profileError) => {
            console.error('Error al crear perfil automático:');
            console.error('Status:', profileError?.status);
            console.error('Body:', JSON.stringify(profileError?.error, null, 2));
            console.error('Message:', profileError?.statusText);
            this.isLoading.set(false);
            this.router.navigate(['/successful-registration']);
          },
        });
      },
      error: (error) => {
        this.isLoading.set(false);
        if (error?.status === 422) {
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
          this.errorMessage.set('Este correo ya está registrado.');
        } else if (error?.status === 400) {
          this.errorMessage.set('Los datos ingresados no son válidos.');
        } else if (error?.status === 500) {
          this.errorMessage.set('Error en el servidor. Intenta de nuevo más tarde.');
        } else {
          this.errorMessage.set('No se pudo completar el registro. Intenta de nuevo.');
        }
        console.error('Error en registro:', error);
      },
    });
  }
}