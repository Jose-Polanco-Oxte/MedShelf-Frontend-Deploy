import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class ApiService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  private options(extras: object = {}) {
    return {
      ...extras,
      withCredentials: true,
      observe: 'body' as const,
    };
  }

  // Ejemplo de método GET
  get<T>(endpoint: string, options: { params?: Record<string, any> } = {}) {
    return this.http.get<T>(`${this.apiUrl}${endpoint}`, this.options(options));
  }

  // Ejemplo de método POST
  post<T>(endpoint: string, data: any) {
    return this.http.post<T>(`${this.apiUrl}${endpoint}`, data, this.options());
  }

  // Ejemplo de método PUT
  put<T>(endpoint: string, data: any) {
    return this.http.put<T>(`${this.apiUrl}${endpoint}`, data, this.options());
  }

  // Ejemplo de método DELETE
  delete<T>(endpoint: string, options?: any) {
    return this.http.delete<T>(`${this.apiUrl}${endpoint}`, this.options(options));
  }
}
