import { Injectable } from '@angular/core';
import { ApiService } from '../../shared/services/api.service';
import { Router } from '@angular/router';

@Injectable({ providedIn: 'root' })
export class HousesService {
  constructor(
    private api: ApiService,
    private router: Router,
  ) {}

  myHouses() {
    return this.api.get('/houses/me');
  }
}
