import { Component, OnInit, signal, ChangeDetectorRef, inject } from '@angular/core';
import { RouterLink, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule, ArrowLeft, Save, CheckCircle } from 'lucide-angular';
import { ApiService } from '../../../../shared/services/api.service';

interface ProfileData {
  id?: string;
  profileId?: string;
  name: string;
  email: string;
  birthDate: string;
  allergies: string[];
}

@Component({
  selector: 'app-edit-info',
  imports: [RouterLink, CommonModule, FormsModule, LucideAngularModule],
  templateUrl: './edit-info.html',
  styleUrl: './edit-info.css',
})
export class EditInfo implements OnInit {
  icons = { arrowLeft: ArrowLeft, save: Save, checkCircle: CheckCircle };
  private router = inject(Router);
  private apiService = inject(ApiService);
  private cdr = inject(ChangeDetectorRef);

  profileData = signal<ProfileData>({
    name: '',
    email: '',
    birthDate: '',
    allergies: [],
  });

  allergyInput = signal<string>('');
  isLoading = signal<boolean>(false);
  toastMessage = '';
  isToastExiting = false;
  private toastTimeoutId: any;

  ngOnInit() {
    this.loadProfile();
  }

  loadProfile() {
    // Obtener datos de la cuenta (nombre y email) desde /auth/account
    this.apiService.get<any>('/auth/account').subscribe({
      next: (authData) => {
        console.log('Datos de auth/account:', authData);

        // Obtener datos del perfil (alergias, fecha de nacimiento) desde /profiles
        this.apiService.get<any>('/profiles').subscribe({
          next: (response) => {
            console.log('Respuesta completa de /profiles:', response);
            const profiles = response.items ?? [];
            console.log('Perfiles array:', profiles);

            if (profiles && profiles.length > 0) {
              const userProfile = profiles[0]; // El primer perfil es del usuario
              console.log('Primer perfil (usuario):', userProfile);
              console.log('Alergias del perfil:', userProfile.allergies);

              const birthDate = this.normalizeDateInput(userProfile.birthDate);

              this.profileData.set({
                id: authData.id || '',
                profileId: userProfile.id || '',
                name: authData.name || '',
                email: authData.email || '',
                birthDate,
                allergies: userProfile.allergies || [],
              });
              console.log('Perfil cargado en el componente:', this.profileData());
            } else {
              // Si no hay perfil, solo usar datos de auth/account
              console.warn('No hay perfiles disponibles');
              this.profileData.set({
                id: authData.id || '',
                name: authData.name || '',
                email: authData.email || '',
                birthDate: '',
                allergies: [],
              });
            }
          },
          error: (error) => {
            console.error('Error al cargar profiles:', error);
            // Aunque falle profiles, mostrar al menos los datos de auth/account
            this.profileData.set({
              id: authData.id || '',
              name: authData.name || '',
              email: authData.email || '',
              birthDate: '',
              allergies: [],
            });
          },
        });
      },
      error: (error) => {
        console.error('Error al cargar auth/account:', error);
      },
    });
  }

  updateName(value: string) {
    const current = this.profileData();
    this.profileData.set({ ...current, name: value });
  }

  updateEmail(value: string) {
    const current = this.profileData();
    this.profileData.set({ ...current, email: value });
  }

  updateBirthDate(value: string) {
    const current = this.profileData();
    this.profileData.set({ ...current, birthDate: value });
  }

  addAllergy() {
    const trimmed = this.allergyInput().trim();
    if (trimmed && !this.profileData().allergies.includes(trimmed)) {
      const current = this.profileData();
      this.profileData.set({
        ...current,
        allergies: [...current.allergies, trimmed],
      });
      this.allergyInput.set('');
    }
  }

  removeAllergy(index: number) {
    const current = this.profileData();
    this.profileData.set({
      ...current,
      allergies: current.allergies.filter((_, i) => i !== index),
    });
  }

  saveProfile() {
    this.isLoading.set(true);
    const current = this.profileData();
    console.log('Datos actuales del perfil a guardar:', current);

    // Validar que birthDate tenga el formato correcto YYYY-MM-DD
    if (!current.birthDate) {
      this.showError('La fecha de nacimiento es requerida');
      this.isLoading.set(false);
      return;
    }

    // Asegurar formato YYYY-MM-DD
    const formattedBirthDate = this.normalizeDateInput(current.birthDate);

    // 1. Actualizar nombre y email en /auth/account usando PATCH
    const authDataToSave = {
      name: current.name.trim(),
      email: current.email.trim(),
    };

    console.log('Guardando datos de cuenta:', authDataToSave);

    this.apiService.patch('/auth/account', authDataToSave).subscribe({
      next: (authResponse: any) => {
        console.log('Datos de cuenta actualizados:', authResponse);

        // 2. Después de actualizar /auth/account, actualizar /profiles
        const profileDataToSave = {
          name: current.name.trim(),
          birthDate: formattedBirthDate,
          allergies: current.allergies && current.allergies.length > 0 ? current.allergies : [],
        };

        // console.log('Guardando datos de perfil:', profileDataToSave);
        // console.log('Array de alergias:', current.allergies);
        // console.log('Cantidad de alergias:', current.allergies?.length);
        // console.log('ID del perfil:', current.profileId);

        // Usar PATCH si existe profileId (actualizar perfil existente), POST si es nuevo
        const profileRequest$ =
          current.profileId && current.profileId.trim()
            ? this.apiService.patch(`/profiles/${current.profileId}`, profileDataToSave)
            : this.apiService.post('/profiles', profileDataToSave);

        const profileAction =
          current.profileId && current.profileId.trim() ? 'actualizar' : 'crear';

        profileRequest$.subscribe({
          next: (profileResponse: any) => {
            this.isLoading.set(false);
            console.log(`Perfil ${profileAction}izado:`, profileResponse);
            this.showSuccess('Información actualizada correctamente');
            setTimeout(() => this.router.navigate(['/account']), 1500);
          },
          error: (error) => {
            this.isLoading.set(false);
            console.error(`Error al ${profileAction} perfil:`, error);
            const errorMsg = error.error?.message || error.message || 'Error desconocido';
            console.error('Detalle del error:', error.error);
            this.showError(`Error al ${profileAction} el perfil: ${errorMsg}`);
          },
        });
      },
      error: (error) => {
        this.isLoading.set(false);
        console.error('Error al actualizar datos de cuenta:', error);
        const errorMsg = error.error?.message || error.message || 'Error desconocido';
        console.error('Detalle del error:', error.error);
        this.showError(`Error al actualizar datos de cuenta: ${errorMsg}`);
      },
    });
  }

  cancel() {
    this.router.navigate(['/account']);
  }

  private showSuccess(message: string) {
    if (this.toastTimeoutId) clearTimeout(this.toastTimeoutId);
    this.toastMessage = message;
    this.isToastExiting = false;
    this.cdr.detectChanges();
    this.toastTimeoutId = setTimeout(() => this.closeToast(), 4000);
  }

  private showError(message: string) {
    if (this.toastTimeoutId) clearTimeout(this.toastTimeoutId);
    this.toastMessage = message;
    this.isToastExiting = false;
    this.cdr.detectChanges();
    this.toastTimeoutId = setTimeout(() => this.closeToast(), 4000);
  }

  closeToast() {
    if (this.toastTimeoutId) clearTimeout(this.toastTimeoutId);
    this.isToastExiting = true;
    this.cdr.detectChanges();
    setTimeout(() => {
      this.toastMessage = '';
      this.isToastExiting = false;
      this.cdr.detectChanges();
    }, 300);
  }

  private normalizeDateInput(value: string) {
    if (!value) return '';

    return value.includes('T') ? value.split('T')[0] : value.slice(0, 10);
  }
}
