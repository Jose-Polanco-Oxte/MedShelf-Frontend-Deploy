import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { tap, catchError, of } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiService } from '../../shared/services/api.service';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private apiUrl = environment.apiUrl;

  isAuthenticated = signal(false);

  constructor(
    private api: ApiService,
    private router: Router,
  ) {}

  login(email: string, password: string) {
    return this.api.post(`/auth/login`, { email, password }).pipe(
      tap(() => {
        this.isAuthenticated.set(true);
        this.router.navigate(['/']);
      }),
    );
  }

  logout() {
    return this.api.post(`/auth/logout`, {}).pipe(
      tap(() => {
        this.isAuthenticated.set(false);
        this.router.navigate(['/login']);
      }),
    );
  }

  register(name: string, email: string, password: string) {
    return this.api.post(`/auth/register`, { name, email, password }).pipe(
      tap(() => {
        this.isAuthenticated.set(false);
        this.router.navigate(['/login']);
      }),
    );
  }

  //refrsh?

  hydrate() {
    return this.api.get(`/auth/me`).pipe(
      tap((user) => {
        this.isAuthenticated.set(true);
        console.log('Usuario autenticado:', user);
        return user;
      }),
      catchError(() => {
        this.isAuthenticated.set(false);
        return of(null);
      }),
    );
  }
}
