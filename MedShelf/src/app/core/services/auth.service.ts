import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { tap, catchError, of, switchMap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiService } from '../../shared/services/api.service';

interface User {
  id: string;
  email: string;
  name: string;
  createdAt: string;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private apiUrl = environment.apiUrl;

  isAuthenticated = signal(false);
  currentUser = signal<User | null>(null);

  constructor(
    private api: ApiService,
    private router: Router,
  ) {}

  login(email: string, password: string) {
    return this.api.post(`/auth/login`, { email, password }).pipe(
      tap(() => {
        this.isAuthenticated.set(true);
      }),
      // Después de hacer login, obtener la información del usuario
      switchMap(() => this.hydrate()),
      tap(() => {
        this.router.navigate(['/']);
      }),
    );
  }

  logout() {
    return this.api.post(`/auth/logout`, {}).pipe(
      tap(() => {
        this.isAuthenticated.set(false);
        this.currentUser.set(null);
        this.router.navigate(['/login']);
      }),
    );
  }

  register(name: string, email: string, password: string) {
    return this.api.post(`/auth/register`, { name, email, password }).pipe(
      tap(() => {
        this.isAuthenticated.set(true);
      }),
      // Después de registrarse, hacer hydrate para obtener el usuario y el token
      switchMap(() => this.hydrate()),
      catchError((error) => {
        console.error('Error en registro:', error);
        throw error;
      }),
    );
  }

  //refrsh?

  hydrate() {
    return this.api.get<User>(`/auth/account`).pipe(
      tap((user) => {
        this.isAuthenticated.set(true);
        this.currentUser.set(user);
        console.log('Usuario autenticado:', user);
        return user;
      }),
      catchError(() => {
        this.isAuthenticated.set(false);
        this.currentUser.set(null);
        return of(null);
      }),
    );
  }
}
