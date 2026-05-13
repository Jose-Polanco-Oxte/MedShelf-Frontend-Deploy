import { Injectable, signal, computed } from '@angular/core';
import { tap } from 'rxjs';
import { ApiService } from '../../shared/services/api.service';

interface ListPlacesParams {
  page?: number;
  cursor?: string;
  size?: number;
  'filter[name]'?: string;
}

interface CreatePlaceRequest {
  name: string;
}

interface UpdatePlaceRequest {
  name: string;
}

export interface HouseReference {
  id: string;
}

export interface PlaceResponse {
  id: string;
  house: HouseReference;
  name: string;
  createdAt: string;
}

interface PlacesListResponse {
  items: PlaceResponse[];
  nextCursor: string | null;
}

@Injectable({ providedIn: 'root' })
export class PlacesService {
  private _places = signal<PlaceResponse[]>([]);
  private _selectedPlace = signal<PlaceResponse | null>(null);
  private _nextCursor = signal<string | null>(null);

  readonly places = this._places.asReadonly();
  readonly selectedPlace = this._selectedPlace.asReadonly();
  readonly hasMore = computed(() => !!this._nextCursor());

  constructor(private api: ApiService) {}

  getPlaces(houseId: string, params?: ListPlacesParams) {
    return this.api
      .get<PlacesListResponse>(`/houses/${houseId}/places`, params ? { params } : undefined)
      .pipe(
        tap(({ items, nextCursor }) => {
          this._places.set(items);
          this._nextCursor.set(nextCursor);
        }),
      );
  }

  loadMore(houseId: string, params?: Omit<ListPlacesParams, 'cursor'>) {
    const cursor = this._nextCursor();
    if (!cursor) return null;

    return this.api
      .get<PlacesListResponse>(`/houses/${houseId}/places`, {
        params: { ...params, cursor },
      })
      .pipe(
        tap(({ items, nextCursor }) => {
          this._places.update((prev) => [...prev, ...items]);
          this._nextCursor.set(nextCursor);
        }),
      );
  }

  getPlaceDetails(placeId: string) {
    return this.api.get<PlaceResponse>(`/places/${placeId}`).pipe(
      tap((place) => this._selectedPlace.set(place)),
    );
  }

  createPlace(houseId: string, data: CreatePlaceRequest) {
    return this.api.post<PlaceResponse>(`/houses/${houseId}/places`, data).pipe(
      tap((place) => this._places.update((prev) => [place, ...prev])),
    );
  }

  updatePlace(placeId: string, data: UpdatePlaceRequest) {
    return this.api.put<PlaceResponse>(`/places/${placeId}`, data).pipe(
      tap((updatedPlace) => {
        this._places.update((prev) =>
          prev.map((place) => (place.id === placeId ? updatedPlace : place)),
        );
        if (this._selectedPlace()?.id === placeId) {
          this._selectedPlace.set(updatedPlace);
        }
      }),
    );
  }

  deletePlace(placeId: string) {
    return this.api.delete(`/places/${placeId}`).pipe(
      tap(() => {
        this._places.update((prev) => prev.filter((place) => place.id !== placeId));
        if (this._selectedPlace()?.id === placeId) {
          this._selectedPlace.set(null);
        }
      }),
    );
  }

  bulkDeletePlaces(houseId: string, placeIds: string[]) {
    return this.api.post(`/houses/${houseId}/places/bulk-delete`, { placeIds }).pipe(
      tap(() => {
        this._places.update((prev) => prev.filter((place) => !placeIds.includes(place.id)));
        if (this._selectedPlace() && placeIds.includes(this._selectedPlace()!.id)) {
          this._selectedPlace.set(null);
        }
      }),
    );
  }

  clearPlaces() {
    this._places.set([]);
    this._selectedPlace.set(null);
    this._nextCursor.set(null);
  }
}
