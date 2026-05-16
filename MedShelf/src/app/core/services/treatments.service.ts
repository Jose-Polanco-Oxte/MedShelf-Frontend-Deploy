import { Injectable, signal, computed } from '@angular/core';
import { tap } from 'rxjs';
import { ApiService } from '../../shared/services/api.service';

interface ListTreatmentsParams {
  profile_id?: string;
  page?: number;
  cursor?: string;
  size?: number;
}

interface CreateTreatmentRequest {
  profileId: string;
  itemId: string;
  frequencyValue: number;
  frequencyUnit: string;
  doseQuantity: number;
  startDate: string;
  endDate: string;
}

interface UpdateTreatmentRequest {
  frequencyValue?: number;
  frequencyUnit?: string;
  doseQuantity?: number;
  endDate?: string;
}

interface RegisterConsumptionRequest {
  amount: number;
}

export interface TreatmentResponse {
  id: string;
  profileId: string;
  itemId: string;
  status: string;
  frequencyValue: number;
  frequencyUnit: string;
  doseQuantity: number;
  startDate: string;
  endDate: string;
  createdAt: string;
}

export interface ItemReference {
  id: string;
}

export interface ConsumptionResponse {
  id: string;
  item: ItemReference;
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

  getTreatments(params?: ListTreatmentsParams) {
    return this.api
      .get<TreatmentsListResponse>('/treatments', params ? { params } : undefined)
      .pipe(
        tap(({ items, nextCursor }: TreatmentsListResponse) => {
          this._treatments.set(items);
          this._nextCursor.set(nextCursor);
        }),
      );
  }

  loadMore(params?: Omit<ListTreatmentsParams, 'cursor'>) {
    const cursor = this._nextCursor();
    if (!cursor) return null;

    return this.api
      .get<TreatmentsListResponse>('/treatments', { params: { ...params, cursor } })
      .pipe(
        tap(({ items, nextCursor }: TreatmentsListResponse) => {
          this._treatments.update((prev: TreatmentResponse[]) => [...prev, ...items]);
          this._nextCursor.set(nextCursor);
        }),
      );
  }

  getTreatmentDetails(treatmentId: string) {
    return this.api
      .get<TreatmentResponse>(`/treatments/${treatmentId}`)
      .pipe(tap((treatment) => this._selectedTreatment.set(treatment)));
  }

  createTreatment(data: CreateTreatmentRequest) {
    return this.api
      .post<TreatmentResponse>('/treatments', data)
      .pipe(tap((treatment) => this._treatments.update((prev) => [treatment, ...prev])));
  }

  updateTreatment(treatmentId: string, data: UpdateTreatmentRequest) {
    return this.api.put<TreatmentResponse>(`/treatments/${treatmentId}`, data).pipe(
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

  updateTreatmentStatus(treatmentId: string, status: string) {
    return this.api.patch<TreatmentResponse>(`/treatments/${treatmentId}`, { status }).pipe(
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

  getTreatmentConsumptions(treatmentId: string, params?: Omit<ListTreatmentsParams, 'profile_id'>) {
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

  loadMoreConsumptions(
    treatmentId: string,
    params?: Omit<ListTreatmentsParams, 'profile_id' | 'cursor'>,
  ) {
    const cursor = this._nextConsumptionsCursor();
    if (!cursor) return null;

    return this.api
      .get<ConsumptionsListResponse>(`/treatments/${treatmentId}/consumptions`, {
        params: { ...params, cursor },
      })
      .pipe(
        tap(({ items, nextCursor }: ConsumptionsListResponse) => {
          this._consumptions.update((prev: ConsumptionResponse[]) => [...prev, ...items]);
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
