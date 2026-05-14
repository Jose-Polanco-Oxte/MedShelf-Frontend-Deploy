import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { LucideAngularModule, ArrowLeft } from 'lucide-angular';
import { ApiService } from '../../../../shared/services/api.service';

@Component({
  selector: 'app-add-location',
  imports: [CommonModule, FormsModule, LucideAngularModule],
  templateUrl: './add-location.html',
  styleUrl: './add-location.css',
})
export class AddLocation implements OnInit {
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
  houseId: string | null = null;

  ngOnInit() {
    this.apiService.get<{ id: string; name: string }>('/houses/me').subscribe({
      next: (house) => {
        this.houseId = (house as any).id;
      },
      error: () => {
        this.errorMessage = 'No se pudo obtener la casa. Intenta de nuevo.';
      },
    });
  }

  addLocation() {
    if (!this.locationData.name.trim()) {
      this.errorMessage = 'Por favor ingresa un nombre para la ubicación';
      return;
    }

    if (!this.houseId) {
      this.errorMessage = 'No se pudo obtener la casa. Intenta de nuevo.';
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';

    this.apiService
      .post(`/houses/${this.houseId}/places`, { name: this.locationData.name.trim() })
      .subscribe({
        next: () => {
          this.isLoading = false;
          this.router.navigate(['/']);
        },
        error: (error) => {
          this.isLoading = false;
          this.errorMessage = 'Error al crear la ubicación. Intenta de nuevo.';
          console.error('Error:', error);
        },
      });
  }

  cancel() {
    if (!this.isLoading) {
      this.router.navigate(['/']);
    }
  }
}