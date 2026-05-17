import { Component, OnInit, signal, ChangeDetectorRef, inject, ViewChild, ElementRef, computed } from '@angular/core';
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

  @ViewChild('birthDateInput') birthDateInput!: ElementRef<HTMLInputElement>;

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

  maxBirthDate = computed(() => {
    const today = new Date();
    today.setFullYear(today.getFullYear() - 18);
    return today.toISOString().split('T')[0];
  });

  openDatePicker() {
    this.birthDateInput?.nativeElement?.showPicker();
  }

  // Normaliza cualquier formato de fecha a YYYY-MM-DD para el input
  normalizeDateForInput(date: string | null | undefined): string {
    if (!date) return '';
    if (date.includes('T')) {
      return date.split('T')[0];
    }
    return date;
  }

  ngOnInit() {
    this.loadProfile();
  }

  loadProfile() {
    this.apiService.get<any>('/auth/account').subscribe({
      next: (authData) => {
        console.log('Datos de auth/account:', authData);

        this.apiService.get<any>('/profiles').subscribe({
          next: (response) => {
            console.log('Respuesta completa de /profiles:', response);
            const profiles = response.items ?? [];

            if (profiles && profiles.length > 0) {
              const userProfile = profiles[0];
              console.log('Primer perfil (usuario):', userProfile);

              this.profileData.set({
                id: authData.id || '',
                profileId: userProfile.id || '',
                name: authData.name || '',
                email: authData.email || '',
                birthDate: this.normalizeDateForInput(userProfile.birthDate),
                allergies: userProfile.allergies || [],
              });

              console.log('Perfil cargado:', this.profileData());
            } else {
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
    this.profileData.set({ ...this.profileData(), name: value });
  }

  updateEmail(value: string) {
    this.profileData.set({ ...this.profileData(), email: value });
  }

  updateBirthDate(value: string) {
    this.profileData.set({ ...this.profileData(), birthDate: value });
  }

  addAllergy() {
    const trimmed = this.allergyInput().trim();
    if (trimmed && !this.profileData().allergies.includes(trimmed)) {
      const current = this.profileData();
      this.profileData.set({ ...current, allergies: [...current.allergies, trimmed] });
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

    if (!current.birthDate) {
      this.showError('La fecha de nacimiento es requerida');
      this.isLoading.set(false);
      return;
    }

    let formattedBirthDate = current.birthDate;
    if (formattedBirthDate.includes('T')) {
      formattedBirthDate = formattedBirthDate.split('T')[0];
    }

    const authDataToSave = {
      name: current.name.trim(),
      email: current.email.trim(),
    };

    this.apiService.patch('/auth/account', authDataToSave).subscribe({
      next: (authResponse: any) => {
        console.log('Datos de cuenta actualizados:', authResponse);

        const profileDataToSave = {
          name: current.name.trim(),
          birthDate: formattedBirthDate,
          allergies: current.allergies && current.allergies.length > 0 ? current.allergies : [],
        };

        const profileRequest$ = current.profileId && current.profileId.trim()
          ? this.apiService.patch(`/profiles/${current.profileId}`, profileDataToSave)
          : this.apiService.post('/profiles', profileDataToSave);

        const profileAction = current.profileId && current.profileId.trim() ? 'actualizar' : 'crear';

        profileRequest$.subscribe({
          next: (profileResponse: any) => {
            this.isLoading.set(false);
            console.log(`Perfil ${profileAction}izado:`, profileResponse);
            this.showSuccess('Información actualizada correctamente');
            setTimeout(() => this.router.navigate(['/account']), 1500);
          },
          error: (error) => {
            this.isLoading.set(false);
            const errorMsg = error.error?.message || error.message || 'Error desconocido';
            this.showError(`Error al ${profileAction} el perfil: ${errorMsg}`);
          },
        });
      },
      error: (error) => {
        this.isLoading.set(false);
        const errorMsg = error.error?.message || error.message || 'Error desconocido';
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
}