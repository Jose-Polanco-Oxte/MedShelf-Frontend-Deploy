import { Component, OnInit, signal } from '@angular/core';
import { RouterLink, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule, ArrowLeft, Save } from 'lucide-angular';
import { ApiService } from '../../../../shared/services/api.service';

interface ProfileData {
  id?: string;
  name: string;
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
  icons = { arrowLeft: ArrowLeft, save: Save };
  
  profileData = signal<ProfileData>({
    name: '',
    birthDate: '',
    allergies: [],
  });

  allergyInput = signal<string>('');
  isLoading = signal<boolean>(false);

  constructor(private router: Router, private apiService: ApiService) {}

  ngOnInit() {
    this.loadProfile();
  }

  loadProfile() {
    // Obtener datos del perfil del usuario desde el backend
    this.apiService.get<any>('/profiles').subscribe({
      next: (response) => {
        const profiles = response.items ?? [];
        if (profiles && profiles.length > 0) {
          const userProfile = profiles[0]; // Asumir que el primer perfil es del usuario
          this.profileData.set({
            id: userProfile.id || '',
            name: userProfile.name || '',
            birthDate: userProfile.birthDate || '',
            allergies: userProfile.allergies || [],
          });
          console.log('Perfil cargado:', this.profileData());
        }
      },
      error: (error) => {
        console.error('Error al cargar perfil:', error);
      },
    });
  }

  updateName(value: string) {
    const current = this.profileData();
    this.profileData.set({ ...current, name: value });
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
    
    // Validar que birthDate tenga el formato correcto YYYY-MM-DD
    if (!current.birthDate) {
      alert('La fecha de nacimiento es requerida');
      this.isLoading.set(false);
      return;
    }

    // Asegurar formato YYYY-MM-DD
    let formattedBirthDate = current.birthDate;
    if (formattedBirthDate.includes('T')) {
      // Si viene con timestamp, extraer solo la fecha
      formattedBirthDate = formattedBirthDate.split('T')[0];
    }
    
    // Guardar todos los datos del perfil
    const profileDataToSave = {
      name: current.name.trim(),
      birthDate: formattedBirthDate,
      allergies: current.allergies && current.allergies.length > 0 ? current.allergies : [],
    };
    
    console.log('Guardando perfil:', profileDataToSave);
    console.log('ID del perfil:', current.id);
    
    // Usar PUT si existe ID (actualizar perfil existente), POST si es nuevo
    const request$ = current.id && current.id.trim()
      ? this.apiService.put(`/profiles/${current.id}`, profileDataToSave)
      : this.apiService.post('/profiles', profileDataToSave);
    
    const action = current.id && current.id.trim() ? 'actualizar' : 'crear';
    
    request$.subscribe({
      next: (response: any) => {
        this.isLoading.set(false);
        console.log(`Perfil ${action}izado:`, response);
        alert(`✓ Perfil ${action}izado`);
        this.router.navigate(['/account']);
      },
      error: (error) => {
        this.isLoading.set(false);
        console.error(`Error al ${action} perfil:`, error);
        const errorMsg = error.error?.message || error.message || 'Error desconocido';
        console.error('Detalle del error:', error.error);
        alert(`Error al ${action} el perfil: ${errorMsg}`);
      },
    });
  }

  cancel() {
    this.router.navigate(['/account']);
  }
}
