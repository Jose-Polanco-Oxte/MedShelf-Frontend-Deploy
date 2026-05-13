import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ThemeService, type Theme } from '../../shared/services/theme.service';
import { LucideAngularModule, Moon, Sun, Plus } from 'lucide-angular';
import { Router, RouterLink } from '@angular/router';
import { ApiService } from '../../shared/services/api.service';

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
export class Profile implements OnInit {
  currentTheme: Theme = 'light';
  icons = { moon: Moon, sun: Sun, plus: Plus };
  isLoading: boolean = false;
  errorMessage: string = '';

  constructor(
    private themeService: ThemeService,
    private router: Router,
    private apiService: ApiService,
  ) {
    this.currentTheme = this.themeService.getCurrentTheme();
  }

  profile: ProfileViewModel = {
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
  };

  familyProfiles: FamilyProfileViewModel[] = [];

  ngOnInit() {
    this.loadProfiles();
  }

  loadProfiles() {
    this.isLoading = true;
    this.errorMessage = '';

    this.apiService.get<ProfilesResponse>('/profiles').subscribe({
      next: (response: ProfilesResponse) => {
        const normalized = this.normalizeProfilesResponse(response);
        const profileSource = normalized.profileSource;
        const familySource = normalized.familySource;

        this.profile = this.mapProfile(profileSource);
        this.familyProfiles = this.mapFamilyProfiles(familySource);
        this.isLoading = false;
      },
      error: (error) => {
        this.isLoading = false;
        this.errorMessage =
          error?.error?.message || error?.error?.detail || 'No se pudieron cargar los perfiles.';
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
    this.router.navigate(['/login']);
  }
}
