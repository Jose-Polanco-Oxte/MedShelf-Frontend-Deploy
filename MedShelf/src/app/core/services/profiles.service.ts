import { Injectable, signal, computed } from '@angular/core';
import { tap } from 'rxjs';
import { ApiService } from '../../shared/services/api.service';

interface ListProfilesParams {
  page?: number;
  cursor?: string;
  size?: number;
  'filter[name]'?: string;
}

interface CreateProfileRequest {
  name: string;
  birthDate: string;
  allergies?: string[];
}

export interface Profile {
  id: string;
  name: string;
  relationship?: string;
  birthDate: string;
  allergies: string[];
  createdAt: string;
}

interface ProfilesListResponse {
  items: Profile[];
  nextCursor: string | null;
}

@Injectable({ providedIn: 'root' })
export class ProfilesService {
  private _profiles = signal<Profile[]>([]);
  private _selectedProfile = signal<Profile | null>(null);
  private _nextCursor = signal<string | null>(null);

  readonly profiles = this._profiles.asReadonly();
  readonly selectedProfile = this._selectedProfile.asReadonly();
  readonly hasMore = computed(() => !!this._nextCursor());

  constructor(private api: ApiService) {}

  getProfiles(params?: ListProfilesParams) {
    return this.api.get<ProfilesListResponse>('/profiles', params ? { params } : undefined).pipe(
      tap(({ items, nextCursor }) => {
        this._profiles.set(items);
        this._nextCursor.set(nextCursor);
      }),
    );
  }

  loadMore(params?: Omit<ListProfilesParams, 'cursor'>) {
    const cursor = this._nextCursor();
    if (!cursor) return null;

    return this.api.get<ProfilesListResponse>('/profiles', { params: { ...params, cursor } }).pipe(
      tap(({ items, nextCursor }) => {
        this._profiles.update((prev) => [...prev, ...items]);
        this._nextCursor.set(nextCursor);
      }),
    );
  }

  getProfileDetails(profileId: string) {
    return this.api
      .get<Profile>(`/profiles/${profileId}`)
      .pipe(tap((profile) => this._selectedProfile.set(profile)));
  }

  createProfile(data: CreateProfileRequest) {
    return this.api
      .post<Profile>('/profiles', data)
      .pipe(tap((profile) => this._profiles.update((prev) => [profile, ...prev])));
  }
}
