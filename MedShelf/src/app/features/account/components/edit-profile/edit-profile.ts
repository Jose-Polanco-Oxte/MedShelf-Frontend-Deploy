import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal, ChangeDetectorRef } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import {
  LucideAngularModule,
  ArrowLeft,
  Save,
  CheckCircle,
  AlertCircle,
  Pencil,
} from 'lucide-angular';
import { ApiService } from '../../../../shared/services/api.service';
import { ProfilesService, type Profile } from '../../../../core/services/profiles.service';

interface ProfileFormData {
  id?: string;
  name: string;
  relationship: string;
  birthDate: string;
  allergies: string[];
  createdAt?: string;
}

@Component({
  selector: 'app-edit-profile',
  imports: [CommonModule, FormsModule, RouterLink, LucideAngularModule],
  templateUrl: './edit-profile.html',
  styleUrl: './edit-profile.css',
})
export class EditProfile implements OnInit {
  icons = {
    arrowLeft: ArrowLeft,
    save: Save,
    checkCircle: CheckCircle,
    alertCircle: AlertCircle,
    edit: Pencil,
  };

  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private apiService = inject(ApiService);
  private profilesService = inject(ProfilesService);
  private cdr = inject(ChangeDetectorRef);

  profileId = '';
  returnUrl = '/account';
  profileData = signal<ProfileFormData>({
    name: '',
    relationship: '',
    birthDate: '',
    allergies: [],
  });

  allergyInput = signal('');
  isLoading = signal(true);
  isSaving = signal(false);
  errorMessage = signal('');
  relations = ['Madre', 'Padre', 'Hijo/a', 'Hermano/a', 'Abuelo/a', 'Tío/a', 'Otro'];
  toastMessage = '';
  isToastExiting = false;
  private toastTimeoutId: any;

  ngOnInit() {
    this.profileId = this.route.snapshot.paramMap.get('profileId') || '';
    this.returnUrl = this.route.snapshot.queryParamMap.get('returnUrl') || '/account';

    if (!this.profileId) {
      this.isLoading.set(false);
      this.errorMessage.set('No se encontró el perfil a editar');
      return;
    }

    this.loadProfile();
  }

  loadProfile() {
    this.isLoading.set(true);
    this.errorMessage.set('');

    this.profilesService.getProfileDetails(this.profileId).subscribe({
      next: (profile) => {
        this.profileData.set(this.toFormData(profile));
        this.isLoading.set(false);
      },
      error: (error) => {
        console.error('Error al cargar el perfil:', error);
        this.errorMessage.set('No se pudo cargar el perfil seleccionado');
        this.isLoading.set(false);
      },
    });
  }

  updateName(value: string) {
    this.profileData.update((current) => ({ ...current, name: value }));
  }

  updateRelationship(value: string) {
    this.profileData.update((current) => ({ ...current, relationship: value }));
  }

  addAllergy() {
    const trimmed = this.allergyInput().trim();
    if (!trimmed) return;

    this.profileData.update((current) => {
      if (current.allergies.includes(trimmed)) return current;

      return { ...current, allergies: [...current.allergies, trimmed] };
    });
    this.allergyInput.set('');
  }

  removeAllergy(index: number) {
    this.profileData.update((current) => ({
      ...current,
      allergies: current.allergies.filter((_, itemIndex) => itemIndex !== index),
    }));
  }

  saveProfile() {
    const current = this.profileData();
    if (!current.name.trim()) {
      this.showError('El nombre es requerido');
      return;
    }

    this.isSaving.set(true);

    const payload = {
      name: current.name.trim(),
      relationship: current.relationship.trim(),
      allergies: current.allergies,
    };

    this.apiService.patch<Profile>(`/profiles/${this.profileId}`, payload).subscribe({
      next: (updatedProfile) => {
        this.isSaving.set(false);
        this.profileData.set(this.toFormData(updatedProfile));
        this.showSuccess('Perfil actualizado correctamente');
        setTimeout(() => this.router.navigateByUrl(this.returnUrl), 1200);
      },
      error: (error) => {
        this.isSaving.set(false);
        console.error('Error al guardar el perfil:', error);
        const errorMsg = error.error?.message || error.message || 'No se pudo guardar el perfil';
        this.showError(errorMsg);
      },
    });
  }

  cancel() {
    this.router.navigateByUrl(this.returnUrl);
  }

  formatDate(value?: string) {
    if (!value) return 'Por definir';

    const date = this.parseDate(value);
    if (!date) return 'Por definir';

    return new Intl.DateTimeFormat('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      timeZone: 'UTC',
    }).format(date);
  }

  private toFormData(profile: Profile): ProfileFormData {
    return {
      id: profile.id,
      name: profile.name || '',
      relationship: profile.relationship || '',
      birthDate: this.normalizeDateInput(profile.birthDate),
      allergies: profile.allergies || [],
      createdAt: profile.createdAt,
    };
  }

  private normalizeDateInput(value: string) {
    if (!value) return '';

    return value.includes('T') ? value.split('T')[0] : value.slice(0, 10);
  }

  private parseDate(value: string) {
    const normalized = value.includes('T') ? value : `${value}T00:00:00Z`;
    const date = new Date(normalized);

    return Number.isNaN(date.getTime()) ? null : date;
  }

  private showSuccess(message: string) {
    if (this.toastTimeoutId) clearTimeout(this.toastTimeoutId);
    this.toastMessage = message;
    this.isToastExiting = false;
    this.cdr.detectChanges();
    this.toastTimeoutId = setTimeout(() => this.closeToast(), 3500);
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
