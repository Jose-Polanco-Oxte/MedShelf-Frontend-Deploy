import { Injectable } from '@angular/core';
import { tap } from 'rxjs';
import { signal } from '@angular/core';
import { ApiService } from '../../shared/services/api.service';

interface ConsumptionParams {
  page?: number;
  cursor?: string;
  size?: number;
  'filter[name]'?: string;
}

interface Item {
  id: string;
  name: string;
}

interface CreateConsumptionResponse {
  id: string;
  item: Item;
  amount: number;
  consumedAt: string;
}

@Injectable({ providedIn: 'root' })
export class ConsumptionsService {
  private _consumptions = signal<CreateConsumptionResponse[]>([]);
  private _selectedConsumption = signal<CreateConsumptionResponse | null>(null);

  readonly consumptions = this._consumptions.asReadonly();
  readonly selectedConsumption = this._selectedConsumption.asReadonly();

  constructor(private api: ApiService) {}

  listConsumptions(itemId: string, params: ConsumptionParams) {
    return this.api
      .get<
        CreateConsumptionResponse[]
      >(`/items/${itemId}/consumptions`, params ? { params } : undefined)
      .pipe(
        tap((response) => {
          this._consumptions.set(response);
        }),
      );
  }

  addConsumption(itemId: string, amount: number) {
    return this.api
      .post<CreateConsumptionResponse>(`/items/${itemId}/consumptions`, {
        itemId,
        amount,
      })
      .pipe(
        tap((newConsumption) => {
          this._consumptions.update((consumptions) => [...consumptions, newConsumption]);
        }),
      );
  }

  getConsumptionDetails(consumptionId: string) {
    return this.api.get<CreateConsumptionResponse>(`/consumptions/${consumptionId}`).pipe(
      tap((response) => {
        this._selectedConsumption.set(response);
      }),
    );
  }
}
