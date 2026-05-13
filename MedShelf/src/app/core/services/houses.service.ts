import { Injectable, signal } from '@angular/core';
import { ApiService } from '../../shared/services/api.service';
import { Router } from '@angular/router';
import { tap } from 'rxjs';

interface Owner {
  id: string;
  name: string;
}

interface HouseResponse {
  id: string;
  owner: Owner;
  name: string;
  createdAt: string;
}

@Injectable({ providedIn: 'root' })
export class HousesService {
  private _house = signal<HouseResponse | null>(null);

  readonly house = this._house.asReadonly();

  constructor(private api: ApiService) {}

  myHouses() {
    return this.api.get<HouseResponse>('/houses/me').pipe(
      tap((house) => {
        this._house.set(house);
      }),
    );
  }
}
