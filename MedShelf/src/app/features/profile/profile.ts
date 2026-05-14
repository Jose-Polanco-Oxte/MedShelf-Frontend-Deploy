import { Component, OnInit, OnDestroy, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ThemeService, type Theme } from '../../shared/services/theme.service';
import { LucideAngularModule, Moon, Sun, Plus } from 'lucide-angular';
import { Router, RouterLink, ActivatedRoute } from '@angular/router';
import { ApiService } from '../../shared/services/api.service';
import { AuthService } from '../../core/services/auth.service';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

interface FamilyProfileViewModel {
  id: string | number;
  name: string;
  initials: string;
  relation: string;
}

interface ProfileViewModel {
  name: string;
  age: number | string;
  bloodtype: string;
  alergies: string[];
  email: string;
  phone: string;
  address: string;
  role: string;
  emergencyContact: {
    name: string;
    phone: string;
  };
}

interface ProfilesResponse {
  profile?: any;
  profiles?: any[];
  data?: any;
  items?: any[];
  [key: string]: any;
}

type ProfilePayload = ProfilesResponse | ProfilesResponse[] | any[] | any;

@Component({
  selector: 'app-profile',
  imports: [CommonModule, LucideAngularModule, RouterLink],
  templateUrl: './profile.html',
  styleUrl: './profile.css',
})
export class Profile implements OnInit, OnDestroy {
  currentTheme: Theme = 'light';
  icons = { moon: Moon, sun: Sun, plus: Plus };
  isLoading = signal(true);
  errorMessage = signal('');
  profile = signal<ProfileViewModel>({
    name: '',
    age: '',
    bloodtype: '',
    alergies: [],
    email: '',
    phone: '',
    address: '',
    role: '',
    emergencyContact: {
      name: '',
      phone: '',
    },
  });
  familyProfiles = signal<FamilyProfileViewModel[]>([]);
  private destroy$ = new Subject<void>();
  private loadingTimeout: any;
  private isFirstLoad = true;

  constructor(
    private themeService: ThemeService,
    private router: Router,
    private apiService: ApiService,
    private authService: AuthService,
    private activatedRoute: ActivatedRoute,
  ) {
    this.currentTheme = this.themeService.getCurrentTheme();
  }

  ngOnInit() {
    // Cargar perfiles cuando se llega a la ruta
    this.activatedRoute.url
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.loadProfiles();
      });
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
    if (this.loadingTimeout) {
      clearTimeout(this.loadingTimeout);
    }
  }

  loadProfiles() {
    this.errorMessage.set('');
    
    // En la primera carga, mostrar loading inmediatamente
    if (this.isFirstLoad) {
      this.isLoading.set(true);
      this.isFirstLoad = false;
    } else {
      // En cargas posteriores, solo mostrar loading si tarda más de 300ms
      this.loadingTimeout = setTimeout(() => {
        this.isLoading.set(true);
      }, 300);
    }

    this.apiService.get<ProfilesResponse>('/profiles').subscribe({
      next: (response: ProfilesResponse) => {
        // Cancelar el timeout si existe
        if (this.loadingTimeout) {
          clearTimeout(this.loadingTimeout);
          this.loadingTimeout = null;
        }
        this.isLoading.set(false);
        const normalized = this.normalizeProfilesResponse(response);
        const profileSource = normalized.profileSource;
        const familySource = normalized.familySource;

        this.profile.set(this.mapProfile(profileSource));
        this.familyProfiles.set(this.mapFamilyProfiles(familySource));
      },
      error: (error) => {
        // Cancelar el timeout en caso de error también
        if (this.loadingTimeout) {
          clearTimeout(this.loadingTimeout);
          this.loadingTimeout = null;
        }
        this.isLoading.set(false);
        this.errorMessage.set(
          error?.error?.message || error?.error?.detail || 'No se pudieron cargar los perfiles.',
        );
      },
    });
  }

  private normalizeProfilesResponse(response: ProfilePayload): {
    profileSource: any;
    familySource: any[];
  } {
    if (Array.isArray(response)) {
      return {
        profileSource: response[0] ?? response,
        familySource: response,
      };
    }

    const data = response?.data;
    const nestedItems = data?.items ?? response?.items ?? [];
    const nestedProfiles = data?.profiles ?? response?.profiles ?? [];

    return {
      profileSource:
        response?.profile ??
        data?.profile ??
        data ??
        nestedItems[0] ??
        nestedProfiles[0] ??
        response,
      familySource: nestedProfiles.length ? nestedProfiles : nestedItems,
    };
  }

  private mapProfile(source: any): ProfileViewModel {
    const allergies = this.normalizeStringArray(
      source?.alergies ?? source?.allergies ?? source?.allergy ?? source?.allergiesList,
    );

    return {
      name:
        this.pickString(source, ['name', 'fullname', 'fullName', 'first_name', 'firstName']) ||
        'Sin nombre',
      age: this.pickStringOrNumber(source, ['age', 'years', 'yearsOld', 'birthdayAge']),
      bloodtype:
        this.pickString(source, ['bloodtype', 'bloodType', 'blood_group', 'bloodGroup']) || '',
      alergies: allergies,
      email: this.pickString(source, ['email', 'mail']) || '',
      phone: this.pickString(source, ['phone', 'phoneNumber', 'mobile']) || '',
      address: this.pickString(source, ['address', 'direction', 'location']) || '',
      role: this.pickString(source, ['role', 'type', 'profileType']) || 'Perfil',
      emergencyContact: {
        name:
          this.pickString(source?.emergencyContact ?? source?.emergency_contact ?? {}, [
            'name',
            'fullname',
            'fullName',
          ]) || '',
        phone:
          this.pickString(source?.emergencyContact ?? source?.emergency_contact ?? {}, [
            'phone',
            'phoneNumber',
            'mobile',
          ]) || '',
      },
    };
  }

  private mapFamilyProfiles(source: any[]): FamilyProfileViewModel[] {
    if (!Array.isArray(source)) {
      return [];
    }

    return source.map((item, index) => {
      const name = this.pickString(item, ['name', 'fullname', 'fullName']) || `Perfil ${index + 1}`;
      return {
        id: item?.id ?? index,
        name,
        initials: this.getInitials(name),
        relation: this.pickString(item, ['relation', 'relationship', 'role']) || 'Perfil familiar',
      };
    });
  }

  private normalizeStringArray(value: unknown): string[] {
    if (Array.isArray(value)) {
      return value.filter(
        (item): item is string => typeof item === 'string' && item.trim().length > 0,
      );
    }

    if (typeof value === 'string' && value.trim()) {
      return value
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean);
    }

    return [];
  }

  private pickString(source: any, keys: string[]): string {
    return this.pickValue(source, keys) as string;
  }

  private pickStringOrNumber(source: any, keys: string[]): string | number {
    const value = this.pickValue(source, keys);
    return typeof value === 'number' || typeof value === 'string' ? value : '';
  }

  private pickValue(source: any, keys: string[]): unknown {
    if (!source || typeof source !== 'object') {
      return '';
    }

    for (const key of keys) {
      const value = source[key];
      if (value !== undefined && value !== null && value !== '') {
        return value;
      }
    }

    return '';
  }

  getInitials(name: string): string {
    return name
      .split(' ')
      .filter(Boolean)
      .map((word) => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  }

  toggleTheme() {
    this.themeService.toggleTheme();
    this.currentTheme = this.themeService.getCurrentTheme();
  }

  editProfile() {
    console.log('Edit profile clicked');
  }

  logout() {
    this.authService.logout().subscribe({
      error: (error) => {
        console.error('Error during logout:', error);
      },
    });
  }
}
