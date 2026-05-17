import { Injectable } from '@angular/core';
import { ApiService } from '../../shared/services/api.service';
import { signal } from '@angular/core';
import { tap } from 'rxjs';

interface ListItemsParams {
  page?: number;
  cursor?: string;
  size?: number;
  'filter[name]'?: string;
  'filter[productId]'?: string;
}

export interface AddItemToPlaceRequest {
  productId: string;
  expirationDate: string;
}

interface Product {
  id: string;
  name: string;
  netContent: {
    value: number;
    unit: string;
  };
  totalQuantity: number;
  pharmaceuticalForm: {
    name: string;
    consumptionType: string;
  };
}

interface Place {
  id: string;
  name: string;
}

export interface ItemResponse {
  id: string;
  product: Product;
  place: Place;
  availableContent: number;
  expirationDate: string;
  createdAt: string;
}

interface ItemsListResponse {
  items: ItemResponse[];
  nextCursor: string | null;
}

@Injectable({ providedIn: 'root' })
export class ItemsService {
  private _items = signal<ItemsListResponse>({ items: [], nextCursor: null });
  private _nextCursor = signal<string | null>(null);
  private _itemsByPlace = signal<Record<string, ItemsListResponse>>({});

  readonly items = this._items.asReadonly();
  readonly nextCursor = this._nextCursor.asReadonly();
  readonly itemsByPlace = this._itemsByPlace.asReadonly();

  constructor(private api: ApiService) {}

  getItemsByPlace(placeId: string, params?: ListItemsParams) {
    return this.api
      .get<ItemsListResponse>(`/places/${placeId}/items`, params ? { params } : undefined)
      .pipe(
        tap((response) => {
          this._itemsByPlace.update((prev) => ({
            ...prev,
            [placeId]: response,
          }));
          this._nextCursor.set(response.nextCursor);
        }),
      );
  }

  addItemToPlace(placeId: string, data: AddItemToPlaceRequest) {
    return this.api.post(`/places/${placeId}/items`, data).pipe(
      tap(() => {
        this.getItemsByPlace(placeId).subscribe();
      }),
    );
  }

  getItemsByHouse(params?: ListItemsParams) {
    return this.api.get<ItemsListResponse>(`/items`, params ? { params } : undefined).pipe(
      tap((response) => {
        this._items.set(response);
      }),
    );
  }

  getItemDetails(itemId: string) {
    return this.api.get<ItemResponse>(`/items/${itemId}`);
  }

  deleteItem(itemId: string) {
    return this.api.delete(`/items/${itemId}`).pipe(
      tap(() => {
        this.getItemsByHouse().subscribe();
      }),
    );
  }

  getItemsInMedkit(medkitId: string, params?: ListItemsParams) {
    return this.api.get<ItemsListResponse>(`/items`, params ? { params } : undefined).pipe(
      tap((response) => {
        this._items.set(response);
      }),
    );
  }
}
