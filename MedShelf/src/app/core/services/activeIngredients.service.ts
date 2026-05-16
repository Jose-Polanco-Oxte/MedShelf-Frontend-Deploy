import { Injectable, signal } from '@angular/core';
import { tap } from 'rxjs';
import { ApiService } from '../../shared/services/api.service';

interface ActiveIngredientParams {
  page?: number;
  cursor?: string;
  size?: number;
  'filter[name]'?: string;
}

interface CreateActiveIngredientRequest {
  name: string;
}

interface ActiveIngredients {
  id: string;
  name: string;
  createdAt: string;
}

@Injectable({ providedIn: 'root' })
export class ActiveIngredientsService {
  private _activeIngredients = signal<ActiveIngredients[]>([]);

  readonly activeIngredientsList = this._activeIngredients.asReadonly();

  constructor(private api: ApiService) {}

  getActiveIngredients(params?: ActiveIngredientParams) {
    return this.api
      .get<ActiveIngredients[]>('/active-ingredients', params ? { params } : undefined)
      .pipe(
        tap((ingredients) => {
          this._activeIngredients.set(ingredients);
        }),
      );
  }

  setActiveIngredients(data: CreateActiveIngredientRequest) {
    return this.api.post<ActiveIngredients>('/active-ingredients', data).pipe(
      tap((newIngredient) => {
        this._activeIngredients.update((ingredients) => [...ingredients, newIngredient]);
      }),
    );
  }

  deleteActiveIngredient(id: string) {
    return this.api.delete(`/active-ingredients/${id}`).pipe(
      tap(() => {
        this._activeIngredients.update((ingredients) =>
          ingredients.filter((ingredient) => ingredient.id !== id),
        );
      }),
    );
  }
}
