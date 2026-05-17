import { CommonModule } from '@angular/common';
import {
  Component,
  EventEmitter,
  Input,
  OnChanges,
  Output,
  SimpleChanges,
  inject,
  signal,
} from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { LucideAngularModule, X, AlertCircle, Pencil } from 'lucide-angular';
import { ProfilesService, type Profile } from '../../../core/services/profiles.service';

@Component({
  selector: 'app-profile-detail-modal',
  imports: [CommonModule, LucideAngularModule, RouterLink],
  templateUrl: './profile-detail-modal.html',
  styleUrl: './profile-detail-modal.css',
})
export class ProfileDetailModal implements OnChanges {
  private profilesService = inject(ProfilesService);
  private router = inject(Router);

  @Input() open = false;
  @Input() profileId: string | null = null;
  @Output() closed = new EventEmitter<void>();

  profile = signal<Profile | null>(null);
  loading = signal(false);
  error = signal('');
  deleting = signal(false);
  deleteError = signal('');

  icons = { close: X, alertCircle: AlertCircle, edit: Pencil };

  get currentUrl() {
    return this.router.url;
  }

  ngOnChanges(changes: SimpleChanges) {
    if ((changes['open'] || changes['profileId']) && this.open && this.profileId) {
      this.loadProfile();
    }

    if (!this.open) {
      this.profile.set(null);
      this.error.set('');
      this.loading.set(false);
    }
  }

  close() {
    this.closed.emit();
  }

  getProfileRoute() {
    return this.profile()?.id ? ['/account/profiles', this.profile()!.id, 'edit'] : null;
  }

  formatDate(value?: string) {
    const date = this.toUtcDate(value);
    if (!date) return 'Por definir';

    return new Intl.DateTimeFormat('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      timeZone: 'UTC',
    }).format(date);
  }

  formatDateTime(value?: string) {
    const date = this.toUtcDate(value);
    if (!date) return 'Por definir';

    return new Intl.DateTimeFormat('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'UTC',
    }).format(date);
  }

  formatDateOnly(value?: string) {
    const date = this.toUtcDate(value);
    if (!date) return 'Por definir';

    return new Intl.DateTimeFormat('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      timeZone: 'UTC',
    }).format(date);
  }

  private loadProfile() {
    if (!this.profileId) return;

    this.loading.set(true);
    this.error.set('');

    this.profilesService.getProfileDetails(this.profileId).subscribe({
      next: (profile) => {
        this.profile.set(profile);
        this.loading.set(false);
      },
      error: () => {
        this.profile.set(null);
        this.error.set('No se pudo cargar el perfil');
        this.loading.set(false);
      },
    });
  }

  getAge(birthDate?: string) {
    const date = this.toUtcDate(birthDate);
    if (!date) return null;

    const today = new Date();
    let age = today.getUTCFullYear() - date.getUTCFullYear();
    const monthDiff = today.getUTCMonth() - date.getUTCMonth();

    if (monthDiff < 0 || (monthDiff === 0 && today.getUTCDate() < date.getUTCDate())) {
      age--;
    }

    return age;
  }

  private toUtcDate(value?: string) {
    if (!value) return null;

    const normalized = value.includes('T') ? value : `${value}T00:00:00Z`;
    const date = new Date(normalized);

    return Number.isNaN(date.getTime()) ? null : date;
  }

  deleteProfile() {
    const id = this.profileId || this.profile()?.id;
    if (!id) return;

    const ok = confirm(
      '¿Estás seguro que quieres eliminar este perfil? Esta acción no se puede deshacer.',
    );
    if (!ok) return;

    this.deleting.set(true);
    this.deleteError.set('');

    this.profilesService.deleteProfile(id).subscribe({
      next: () => {
        this.deleting.set(false);
        this.close();
      },
      error: () => {
        this.deleting.set(false);
        this.deleteError.set('No se pudo eliminar el perfil');
      },
    });
  }
}
