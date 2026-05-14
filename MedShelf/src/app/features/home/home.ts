import { Component, inject, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideAngularModule, House, Plus, X, AlertCircle, Building2 } from 'lucide-angular';
import { ThemeService } from '../../shared/services/theme.service';
import { ApiService } from '../../shared/services/api.service';
import { ProfilesService } from '../../core/services/profiles.service';
import { RouterLink } from '@angular/router';

interface HouseOwner {
  id: string;
  name: string;
}

interface HouseResponse {
  id: string;
  name: string;
  owner: HouseOwner;
  createdAt: string;
}

interface LocationViewModel {
  id: string;
  name: string;
  quantity: number;
}

interface ProfileViewModel {
  id: string;
  name: string;
  initials: string;
  email?: string;
  relationship?: string;
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
  private profilesService = inject(ProfilesService);
  private cdr = inject(ChangeDetectorRef);

  houseData: HouseResponse | null = null;
  locations: LocationViewModel[] = [];
  profiles: ProfileViewModel[] = [];
  isLoading = true;
  error: string | null = null;
  isToastExiting = false;
  private errorTimeoutId: any;

  icons = {
    house: House,
    plus: Plus,
    x: X,
    alertCircle: AlertCircle,
    building: Building2,
  };

  ngOnInit() {
    this.themeService.theme$.subscribe();
    this.loadHouseData();
    this.loadProfiles();
  }

  trackByLocation(index: number, item: LocationViewModel) {
    return item?.id ?? index;
  }

  trackByProfile(index: number, item: ProfileViewModel) {
    return item?.id ?? index;
  }

  loadHouseData() {
    // 1. Primero obtenemos la casa del usuario autenticado
    this.apiService.get<HouseResponse>('/houses/me').subscribe({
      next: (house) => {
        this.houseData = house as unknown as HouseResponse;
        this.cdr.detectChanges();
        // 2. Con el id real cargamos los lugares
        this.loadPlaces(this.houseData.id);
      },
      error: (error) => {
        console.error('Error cargando la casa:', error);
        this.isLoading = false;
        this.showError('Error cargando los datos de la casa');
      },
    });
  }

  private loadPlaces(houseId: string) {
    this.apiService
      .get<{ items: Array<{ id: string; name: string }> }>(`/houses/${houseId}/places`)
      .subscribe({
        next: (response) => {
          const items = (response as any).items ?? [];
          this.locations = items.map((loc: { id: string; name: string }) => ({
            id: loc.id,
            name: loc.name,
            quantity: 0,
          }));
          this.cdr.detectChanges();

          // 3. Para cada lugar obtenemos el conteo de items
          this.locations.forEach((loc) => this.loadItemCount(loc.id));
        },
        error: (error) => {
          console.error('Error cargando los lugares:', error);
          this.showError('Error cargando las ubicaciones');
        },
        complete: () => {
          this.isLoading = false;
          this.cdr.detectChanges();
        },
      });
  }

  // Carga el conteo real de medicamentos usando /places/{placeId}/items
  loadLocationDetails(locationId: string) {
    this.loadItemCount(locationId);
  }

  private loadItemCount(placeId: string) {
    this.apiService
      .get<{ items: any[]; nextCursor?: string }>(`/places/${placeId}/items`)
      .subscribe({
        next: (response) => {
          const items = (response as any).items ?? [];
          const idx = this.locations.findIndex((l) => l.id === placeId);
          if (idx !== -1) {
            this.locations[idx] = { ...this.locations[idx], quantity: items.length };
            this.cdr.detectChanges();
          }
        },
        error: (error) => {
          console.error(`Error cargando items del lugar ${placeId}:`, error);
        },
      });
  }

  deleteLocation(locationId: string, event: Event) {
    event.stopPropagation();

    if (!confirm('¿Estás seguro de que quieres eliminar esta ubicación?')) {
      return;
    }

    this.apiService.delete(`/places/${locationId}`).subscribe({
      next: () => {
        this.locations = this.locations.filter((loc) => loc.id !== locationId);
        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error('Error eliminando la ubicación:', error);
        this.showError('Error al eliminar la ubicación. Intenta de nuevo.');
      },
    });
  }

  loadProfiles() {
    this.profilesService.getProfiles().subscribe({
      next: () => {
        this.profiles = this.profilesService.profiles().map((profile) => ({
          id: profile.id,
          name: profile.name,
          initials: profile.name
            .split(' ')
            .map((n: string) => n[0])
            .join('')
            .toUpperCase()
            .slice(0, 2),
          email: profile.email,
          relationship: '',
        }));
        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error('Error cargando los perfiles:', error);
        this.showError('Error cargando los perfiles');
      },
    });
  }

  closeError() {
    if (this.errorTimeoutId) clearTimeout(this.errorTimeoutId);
    this.isToastExiting = true;
    this.cdr.detectChanges();
    setTimeout(() => {
      this.error = null;
      this.isToastExiting = false;
      this.cdr.detectChanges();
    }, 300);
  }

  private showError(message: string) {
    if (this.errorTimeoutId) clearTimeout(this.errorTimeoutId);
    this.error = message;
    this.isToastExiting = false;
    this.cdr.detectChanges();
    this.errorTimeoutId = setTimeout(() => this.closeError(), 4000);
  }
}