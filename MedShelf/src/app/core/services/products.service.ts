import { Injectable, signal, computed } from '@angular/core';
import { tap } from 'rxjs';
import { ApiService } from '../../shared/services/api.service';

interface ListProductsParams {
  page?: number;
  cursor?: string;
  size?: number;
  'filter[name]'?: string;
}

export interface NetContent {
  value: number;
  unit: string;
}

export interface Strength {
  value: number;
  unit: string;
}

export interface ActiveIngredient {
  name: string;
  strength: Strength;
}

export interface Composition {
  referenceAmount?: number;
  activeIngredients?: ActiveIngredient[];
}

export interface PharmaceuticalForm {
  name: string;
  consumptionType: string;
}

export interface ProductResponse {
  id: string;
  name: string;
  netContent: NetContent;
  totalQuantity: number;
  pharmaceuticalForm: PharmaceuticalForm;
  createdAt: string;
  composition: Composition;
}

interface CreateProductRequest {
  name: string;
  netContent: NetContent;
  totalQuantity: number;
  pharmaceuticalForm: string;
  composition: Composition;
}

interface ProductsListResponse {
  items: ProductResponse[];
  nextCursor: string | null;
}

@Injectable({ providedIn: 'root' })
export class ProductsService {
  private _products = signal<ProductResponse[]>([]);
  private _selectedProduct = signal<ProductResponse | null>(null);
  private _nextCursor = signal<string | null>(null);

  readonly products = this._products.asReadonly();
  readonly selectedProduct = this._selectedProduct.asReadonly();
  readonly hasMore = computed(() => !!this._nextCursor());

  constructor(private api: ApiService) {}

  getProducts(params?: ListProductsParams) {
    return this.api.get<ProductsListResponse>('/products', params ? { params } : undefined).pipe(
      tap(({ items, nextCursor }) => {
        this._products.set(items);
        this._nextCursor.set(nextCursor);
      }),
    );
  }

  loadMore(params?: Omit<ListProductsParams, 'cursor'>) {
    const cursor = this._nextCursor();
    if (!cursor) return null;

    return this.api
      .get<ProductsListResponse>('/products', { params: { ...params, cursor } })
      .pipe(
        tap(({ items, nextCursor }) => {
          this._products.update((prev) => [...prev, ...items]);
          this._nextCursor.set(nextCursor);
        }),
      );
  }

  getProductDetails(productId: string) {
    return this.api.get<ProductResponse>(`/products/${productId}`).pipe(
      tap((product) => this._selectedProduct.set(product)),
    );
  }

  createProduct(data: CreateProductRequest) {
    return this.api.post<ProductResponse>('/products', data).pipe(
      tap((product) => this._products.update((prev) => [product, ...prev])),
    );
  }

  clearProducts() {
    this._products.set([]);
    this._selectedProduct.set(null);
    this._nextCursor.set(null);
  }
}
