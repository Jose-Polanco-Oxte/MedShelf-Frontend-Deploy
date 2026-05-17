import { Component, OnInit, OnDestroy, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ThemeService, type Theme } from '../../shared/services/theme.service';
import { LucideAngularModule, Moon, Sun, Plus, ArrowLeft, Save, X } from 'lucide-angular';
import { Router, RouterLink, ActivatedRoute } from '@angular/router';
import { ApiService } from '../../shared/services/api.service';
import { AuthService } from '../../core/services/auth.service';
import { ProfilesService } from '../../core/services/profiles.service';
import { Subject } from 'rxjs';
import { takeUntil, switchMap, finalize } from 'rxjs/operators';
import { ProfileDetailModal } from '../../shared/components/profile-detail-modal/profile-detail-modal';

interface AccountInfo {
  name?: string;
  email?: string;
  birthDate?: string;
  age?: number;
  allergies?: string[];
}

interface FamilyProfile {
  id: string;
  name: string;
  relation?: string;
}

@Component({
  selector: 'app-account',
  imports: [CommonModule, LucideAngularModule, RouterLink, FormsModule, ProfileDetailModal],
  templateUrl: './account.html',
  styleUrl: './account.css',
})
export class Account implements OnInit, OnDestroy {
  currentTheme: Theme = 'light';
  icons = { moon: Moon, sun: Sun, plus: Plus, arrowLeft: ArrowLeft, save: Save, close: X };
  isLoading = signal(false);
  isDeletingAccount = signal(false);
  deleteErrorMessage = signal('');
  errorMessage = signal('');
  accountInfo = signal<AccountInfo | null>(null);
  familyProfiles = signal<FamilyProfile[]>([]);
  profileModalOpen = signal(false);
  selectedProfileId = signal<string | null>(null);
  showDeleteModal = signal(false);
  deleteConfirmationInput = signal('');
  deleteConfirmationError = signal('');
  private destroy$ = new Subject<void>();

  constructor(
    private themeService: ThemeService,
    private router: Router,
    private authService: AuthService,
    private apiService: ApiService,
    private profilesService: ProfilesService,
  ) {
    this.currentTheme = this.themeService.getCurrentTheme();
  }

  ngOnInit() {
    this.isLoading.set(true);

    // Obtener información del usuario y sus perfiles de manera secuencial
    this.apiService
      .get<any>('/auth/account')
      .pipe(
        switchMap((currentUser) => {
          console.log('Usuario obtenido:', currentUser);

          // Guardar el usuario en un lugar temporal para usarlo después
          (this as any)._currentUser = currentUser;

          // Obtener perfiles del usuario
          return this.profilesService.getProfiles();
        }),
        takeUntil(this.destroy$),
      )
      .subscribe({
        next: (response: any) => {
          console.log('Respuesta de perfiles:', response);

          const currentUser = (this as any)._currentUser;
          const profiles = response.items ?? response ?? [];
          console.log('Perfiles procesados:', profiles);

          // Construir la información de la cuenta combinando datos de /auth/account y /profiles
          const accountData: AccountInfo = {
            name: currentUser.name,
            email: currentUser.email,
            birthDate: undefined,
            age: undefined,
            allergies: [],
          };

          if (profiles && profiles.length > 0) {
            const userProfile = profiles[0]; // El primer perfil es del usuario registrado
            console.log('Perfil del usuario:', userProfile);
            console.log('Alergias en el perfil:', userProfile.allergies);
            console.log('Tipo de alergias:', typeof userProfile.allergies);

            // Actualizar con datos del perfil
            accountData.name = userProfile.name || currentUser.name;
            accountData.birthDate = userProfile.birthDate;
            accountData.age = userProfile.birthDate
              ? this.calculateAge(userProfile.birthDate)
              : undefined;
            accountData.allergies = userProfile.allergies || [];

            // Los perfiles restantes son familiares
            if (profiles.length > 1) {
              this.familyProfiles.set(
                profiles.slice(1).map((profile: any) => ({
                  id: profile.id,
                  name: profile.name,
                  relation: profile.relationship || 'Familiar',
                })),
              );
            } else {
              this.familyProfiles.set([]);
            }
          } else {
            console.warn('No se encontraron perfiles');
            this.familyProfiles.set([]);
          }

          // Establecer toda la información de una vez
          this.accountInfo.set(accountData);
          console.log('Información de cuenta establecida:', accountData);

          this.isLoading.set(false);
        },
        error: (error) => {
          console.error('Error en la carga de datos:', error);
          this.errorMessage.set('Error al cargar la información del perfil');
          this.isLoading.set(false);
        },
      });
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // Calcular edad desde la fecha de nacimiento
  calculateAge(birthDate: string): number {
    const birth = this.parseDate(birthDate);
    if (!birth) {
      return 0;
    }

    const today = new Date();
    let age = today.getUTCFullYear() - birth.getUTCFullYear();
    const monthDiff = today.getUTCMonth() - birth.getUTCMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getUTCDate() < birth.getUTCDate())) {
      age--;
    }
    return age;
  }

  toggleTheme() {
    this.themeService.toggleTheme();
    this.currentTheme = this.themeService.getCurrentTheme();
  }

  logout() {
    this.authService.logout().subscribe({
      error: (error) => {
        console.error('Error during logout:', error);
      },
    });
  }

  deleteAccount() {
    this.openDeleteModal();
  }

  openDeleteModal() {
    this.deleteConfirmationInput.set('');
    this.deleteConfirmationError.set('');
    this.showDeleteModal.set(true);
  }

  cancelDelete() {
    this.showDeleteModal.set(false);
    this.deleteConfirmationInput.set('');
    this.deleteConfirmationError.set('');
  }

  confirmDelete() {
    const input = this.deleteConfirmationInput().trim();
    if (input !== 'ELIMINAR') {
      this.deleteConfirmationError.set('Debes escribir ELIMINAR para confirmar');
      return;
    }

    this.isDeletingAccount.set(true);
    this.apiService
      .delete('/auth/account')
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => this.isDeletingAccount.set(false)),
      )
      .subscribe({
        next: () => {
          this.authService.isAuthenticated.set(false);
          this.authService.currentUser.set(null);
          this.router.navigate(['/account-deleted']);
        },
        error: (error) => {
          console.error('Error deleting account:', error);
          const errorMsg = error.error?.message || error.message || 'No se pudo eliminar la cuenta';
          this.deleteErrorMessage.set(errorMsg);
          this.showDeleteModal.set(false);
        },
      });
  }

  getInitial(name: string): string {
    return (name?.charAt(0) || 'F').toUpperCase();
  }

  openProfile(profileId: string) {
    this.selectedProfileId.set(profileId);
    this.profileModalOpen.set(true);
  }

  closeProfileModal() {
    this.profileModalOpen.set(false);
    this.selectedProfileId.set(null);
  }

  private parseDate(value: string) {
    if (!value) return null;

    const normalized = value.includes('T') ? value : `${value}T00:00:00Z`;
    const date = new Date(normalized);

    return Number.isNaN(date.getTime()) ? null : date;
  }
}
