import { Component, OnInit } from '@angular/core';
import { RouterLink, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule, ArrowLeft, Save } from 'lucide-angular';
import { ApiService } from '../../../../shared/services/api.service';

interface ProfileData {
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
  
  profileData: ProfileData = {
    name: '',
    birthDate: '',
    allergies: [],
  };

  allergyInput: string = '';
  isLoading: boolean = false;

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
          this.profileData = {
            name: userProfile.name || '',
            birthDate: userProfile.birthDate || '',
            allergies: userProfile.allergies || [],
          };
        }
      },
      error: (error) => {
        console.error('Error al cargar perfil:', error);
      },
    });
  }

  addAllergy() {
    if (this.allergyInput.trim() && !this.profileData.allergies.includes(this.allergyInput.trim())) {
      this.profileData.allergies.push(this.allergyInput.trim());
      this.allergyInput = '';
    }
  }

  removeAllergy(index: number) {
    this.profileData.allergies.splice(index, 1);
  }

  saveProfile() {
    this.isLoading = true;
    
    // Guardar solo birthDate y allergies, no el nombre
    const profileDataToSave = {
      birthDate: this.profileData.birthDate,
      allergies: this.profileData.allergies,
    };
    
    // Guardar datos en el backend
    this.apiService.post('/profiles', profileDataToSave).subscribe({
      next: (response: any) => {
        this.isLoading = false;
        alert(`✓ Perfil actualizado`);
        this.router.navigate(['/account']);
      },
      error: (error) => {
        this.isLoading = false;
        console.error('Error al guardar perfil:', error);
        alert('Error al guardar el perfil');
      },
    });
  }

  cancel() {
    this.router.navigate(['/account']);
  }
}
