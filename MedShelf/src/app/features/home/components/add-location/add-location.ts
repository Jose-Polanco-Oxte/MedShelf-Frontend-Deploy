import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { LucideAngularModule, ArrowLeft } from 'lucide-angular';
import { ApiService } from '../../../../shared/services/api.service';

interface Location {
  id: number;
  name: string;
  description: string;
  icon: string;
  quantity: number;
}

@Component({
  selector: 'app-add-location',
  imports: [CommonModule, FormsModule, LucideAngularModule],
  templateUrl: './add-location.html',
  styleUrl: './add-location.css',
})
export class AddLocation {
  private router = inject(Router);
  private apiService = inject(ApiService);

  icons = { arrowLeft: ArrowLeft };

  locationData = {
    name: '',
    description: '',
    icon: 'house',
  };

  icons_options = ['house', 'office', 'warehouse', 'cabinet', 'drawer'];
  isLoading = false;
  errorMessage = '';

  // Agregar nueva ubicación al backend
  addLocation() {
    if (!this.locationData.name.trim()) {
      this.errorMessage = 'Por favor ingresa un nombre para la ubicación';
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';

    const houseId = 'cf0107ee-e86d-424f-818a-85ba26ea5335';
    const endpoint = `/houses/${houseId}/places`;
    const payload = { name: this.locationData.name };

    this.apiService.post(endpoint, payload).subscribe({
      next: (response) => {
        console.log('Ubicación creada exitosamente:', response);
        this.isLoading = false;
        // Volver a la página principal
        this.router.navigate(['/']);
      },
      error: (error) => {
        this.isLoading = false;
        this.errorMessage = 'Error al crear la ubicación. Intenta de nuevo.';
        console.error('Error:', error);
      },
    });
  }

  // Cancelar
  cancel() {
    if (!this.isLoading) {
      this.router.navigate(['/']);
    }
  }
}
