import { Injectable, signal, computed } from '@angular/core';
import { tap } from 'rxjs';
import { ApiService } from '../../shared/services/api.service';

interface ListTreatmentsParams {
  page?: number;
  cursor?: string;
  size?: number;
}

interface CreateTreatmentRequest {
  itemId: string;
  dose: number;
  frequencyHours: number;
  startDate: string;
  days: number;
}

interface UpdateTreatmentRequest {
  dose?: number;
  frequencyHours?: number;
  status?: 'active' | 'completed' | 'paused';
  startDate?: Date;
  endDate?: Date;
}

interface RegisterConsumptionRequest {
  amount: number;
}

interface profile {
  id: string;
  name: string;
}

interface Item {
  id: string;
  product: {
    id: string;
    name: string;
  };
}

export interface TreatmentResponse {
  id: string;
  profile: profile;
  item: Item;
  status: string;
  dose: number;
  frequencyHours: number;
  startDate: string;
  days: number;
  createdAt: string;
}

export interface ConsumptionResponse {
  id: string;
  item: Item;
  amount: number;
  consumedAt: string;
}

interface TreatmentsListResponse {
  items: TreatmentResponse[];
  nextCursor: string | null;
}

interface ConsumptionsListResponse {
  items: ConsumptionResponse[];
  nextCursor: string | null;
}

@Injectable({ providedIn: 'root' })
export class TreatmentsService {
  private _treatments = signal<TreatmentResponse[]>([]);
  private _selectedTreatment = signal<TreatmentResponse | null>(null);
  private _nextCursor = signal<string | null>(null);
  private _consumptions = signal<ConsumptionResponse[]>([]);
  private _nextConsumptionsCursor = signal<string | null>(null);

  readonly treatments = this._treatments.asReadonly();
  readonly selectedTreatment = this._selectedTreatment.asReadonly();
  readonly hasMore = computed(() => !!this._nextCursor());
  readonly consumptions = this._consumptions.asReadonly();
  readonly hasMoreConsumptions = computed(() => !!this._nextConsumptionsCursor());

  constructor(private api: ApiService) {}

  getTreatmentsByProfile(profileId: string, params?: ListTreatmentsParams) {
    return this.api
      .get<TreatmentsListResponse>(
        `/profiles/${profileId}/treatments`,
        params ? { params: params } : undefined,
      )
      .pipe(
        tap(({ items, nextCursor }: TreatmentsListResponse) => {
          this._treatments.set(items);
          this._nextCursor.set(nextCursor);
        }),
      );
  }

  createTreatment(profileId: string, data: CreateTreatmentRequest) {
    return this.api
      .post<TreatmentResponse>(`/profiles/${profileId}/treatments`, data)
      .pipe(
        tap((newTreatment) =>
          this._treatments.update((prev: TreatmentResponse[]) => [newTreatment, ...prev]),
        ),
      );
  }

  getAllTreatments(params?: ListTreatmentsParams) {
    return this.api
      .get<TreatmentsListResponse>('/treatments', params ? { params: params } : undefined)
      .pipe(
        tap(({ items, nextCursor }: TreatmentsListResponse) => {
          this._treatments.set(items);
          this._nextCursor.set(nextCursor);
        }),
      );
  }

  getTreatmentDetails(treatmentId: string) {
    return this.api
      .get<TreatmentResponse>(`/treatments/${treatmentId}`)
      .pipe(tap((treatment) => this._selectedTreatment.set(treatment)));
  }

  updateTreatment(treatmentId: string, updateTreatmentRequest: UpdateTreatmentRequest) {
    return this.api
      .patch<TreatmentResponse>(`/treatments/${treatmentId}`, updateTreatmentRequest)
      .pipe(
        tap((updatedTreatment: TreatmentResponse) => {
          this._treatments.update((prev: TreatmentResponse[]) =>
            prev.map(
              (treatment: TreatmentResponse): TreatmentResponse =>
                treatment.id === treatmentId ? updatedTreatment : treatment,
            ),
          );
          if (this._selectedTreatment()?.id === treatmentId) {
            this._selectedTreatment.set(updatedTreatment);
          }
        }),
      );
  }

  getTreatmentConsumptions(treatmentId: string, params?: ListTreatmentsParams) {
    return this.api
      .get<ConsumptionsListResponse>(
        `/treatments/${treatmentId}/consumptions`,
        params ? { params } : undefined,
      )
      .pipe(
        tap(({ items, nextCursor }: ConsumptionsListResponse) => {
          this._consumptions.set(items);
          this._nextConsumptionsCursor.set(nextCursor);
        }),
      );
  }

  registerConsumption(treatmentId: string, data: RegisterConsumptionRequest) {
    return this.api
      .post<ConsumptionResponse>(`/treatments/${treatmentId}/consumptions`, data)
      .pipe(
        tap((consumption) =>
          this._consumptions.update((prev: ConsumptionResponse[]) => [consumption, ...prev]),
        ),
      );
  }

  clearTreatments() {
    this._treatments.set([]);
    this._selectedTreatment.set(null);
    this._nextCursor.set(null);
  }

  clearConsumptions() {
    this._consumptions.set([]);
    this._nextConsumptionsCursor.set(null);
  }
}
