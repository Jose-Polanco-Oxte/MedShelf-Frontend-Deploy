import { Component, OnInit, OnDestroy, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ThemeService, type Theme } from '../../shared/services/theme.service';
import { LucideAngularModule, Moon, Sun, Plus, ArrowLeft, Save } from 'lucide-angular';
import { Router, RouterLink, ActivatedRoute } from '@angular/router';
import { ApiService } from '../../shared/services/api.service';
import { AuthService } from '../../core/services/auth.service';
import { ProfilesService } from '../../core/services/profiles.service';
import { Subject } from 'rxjs';
import { takeUntil, switchMap } from 'rxjs/operators';

interface AccountInfo {
  name?: string;
  email?: string;
  birthDate?: string;
  age?: number;
  allergies?: string[];
}

interface FamilyProfile {
  name: string;
  relation?: string;
}

@Component({
  selector: 'app-account',
  imports: [CommonModule, LucideAngularModule, RouterLink],
  templateUrl: './account.html',
  styleUrl: './account.css',
})
export class Account implements OnInit, OnDestroy {
  currentTheme: Theme = 'light';
  icons = { moon: Moon, sun: Sun, plus: Plus, arrowLeft: ArrowLeft, save: Save };
  isLoading = signal(false);
  errorMessage = signal('');
  accountInfo = signal<AccountInfo | null>(null);
  familyProfiles = signal<FamilyProfile[]>([]);
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
    this.apiService.get<any>('/auth/account')
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
            accountData.age = userProfile.birthDate ? this.calculateAge(userProfile.birthDate) : undefined;
            accountData.allergies = userProfile.allergies || [];

            // Los perfiles restantes son familiares
            if (profiles.length > 1) {
              this.familyProfiles.set(
                profiles.slice(1).map((profile: any) => ({
                  name: profile.name,
                  relation: profile.relationship || 'Familiar',
                }))
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
    const birth = new Date(birthDate);
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
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

  getInitial(name: string): string {
    return (name?.charAt(0) || 'F').toUpperCase();
  }
}
