import { Component, inject, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideAngularModule, House, Plus, X, InfoIcon } from 'lucide-angular';
import { ThemeService } from '../../shared/services/theme.service';
import { ApiService } from '../../shared/services/api.service';
import { RouterLink } from '@angular/router';

interface HouseResponse {
  id: string;
  name: string;
  description?: string;
  members?: any[];
  locations?: any[];
}

interface LocationViewModel {
  id: string;
  name: string;
  description: string;
  quantity: number;
}

@Component({
  selector: 'app-home',
  imports: [CommonModule, LucideAngularModule, RouterLink],
  templateUrl: './home.html',
  styleUrl: './home.css',
})
export class Home implements OnInit {
  private themeService = inject(ThemeService);
  private apiService = inject(ApiService);
  private cdr = inject(ChangeDetectorRef);

  houseData: HouseResponse | null = null;
  locations: LocationViewModel[] = [];
  isLoading = true;
  error: string | null = null;

  ngOnInit() {
    this.themeService.theme$.subscribe();
    this.loadHouseData();
  }

  trackByLocation(index: number, item: LocationViewModel) {
    return item && item.id ? item.id : index;
  }

  trackByProfile(index: number, item: any) {
    return item && item.id ? item.id : index;
  }

  loadHouseData() {
    const houseId = 'cf0107ee-e86d-424f-818a-85ba26ea5335';
    const houseEndpoint = `/houses/${houseId}`;
    const locationsEndpoint = `/houses/${houseId}/places`;

    this.apiService.get<HouseResponse>(houseEndpoint).subscribe({
      next: (house) => {
        this.houseData = house as unknown as HouseResponse;
        this.cdr.detectChanges();
        console.log('Datos de la casa:', house);
      },
      error: (error) => {
        this.error = 'Error cargando los datos de la casa';
        console.error('Error cargando la casa:', error);
      },
    });

    this.apiService
      .get<{ items?: Array<{ id?: string; name?: string }> }>(locationsEndpoint)
      .subscribe({
        next: (locationsResponse) => {
          const response = locationsResponse as {
            items?: Array<{ id?: string; name?: string }>;
          };
          const items = response.items ?? [];
          console.log('Datos de las ubicaciones (raw):', items);
          this.locations = items.map((location: { id?: string; name?: string }) => ({
            id: location.id ?? crypto.randomUUID(),
            name: location.name ?? 'Ubicación sin nombre',
            description: 'Ubicación sin descripción',
            quantity: 0,
          }));
          console.log('Datos de las ubicaciones (normalizados):', this.locations);
          this.cdr.detectChanges();
        },
        error: (error) => {
          this.error = 'Error cargando las ubicaciones';
          console.error('Error cargando las ubicaciones:', error);
        },
        complete: () => {
          this.isLoading = false;
        },
      });
  }

  loadLocationDetails(locationId: string) {
    const endpoint = `/places/${locationId}`;
    this.apiService.get<{ items?: any[] }>(endpoint).subscribe({
      next: (response) => {
        const payload = response as { items?: any[] };
        const items = payload.items ?? [];
        const quantity = items.length;
        const locationIndex = this.locations.findIndex((loc) => loc.id === locationId);
        if (locationIndex !== -1) {
          this.locations[locationIndex].quantity = quantity;
          this.cdr.detectChanges();
        }
        console.log(`Detalles de la ubicación ${locationId}:`, response);
      },
      error: (error) => {
        console.error(`Error cargando los detalles de la ubicación ${locationId}:`, error);
      },
    });
  }

  deleteLocation(locationId: string, event: Event) {
    event.stopPropagation();

    if (!confirm('¿Estás seguro de que quieres eliminar esta ubicación?')) {
      return;
    }

    const houseId = 'cf0107ee-e86d-424f-818a-85ba26ea5335';
    const endpoint = `/places/${locationId}`;
    const options = { headers: { 'X-House-Id': houseId } };

    this.apiService.delete(endpoint, options).subscribe({
      next: (response) => {
        console.log('Ubicación eliminada exitosamente:', response);
        // Remover la ubicación del array
        this.locations = this.locations.filter((loc) => loc.id !== locationId);
        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error('Error eliminando la ubicación:', error);
        alert('Error al eliminar la ubicación. Intenta de nuevo.');
      },
    });
  }

  profiles = [
    {
      id: 1,
      name: 'Ana',
      initials: 'A',
      relationship: 'Madre',
      route: '/admin',
    },
    {
      id: 2,
      name: 'Juan',
      initials: 'J',
      relationship: 'Hijo',
      route: '/user',
    },
  ];

  icons = {
    house: House,
    plus: Plus,
    x: X,
  };
}
