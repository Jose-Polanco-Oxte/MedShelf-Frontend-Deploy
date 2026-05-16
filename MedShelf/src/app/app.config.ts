import {
  ApplicationConfig,
  provideBrowserGlobalErrorListeners,
  APP_INITIALIZER,
} from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { credentialsInterceptor } from './core/interceptors/credentials.interceptor';
import { AuthService } from './core/services/auth.service';
import { HousesService } from './core/services/houses.service';
import { routes } from './app.routes';
import { Router } from '@angular/router';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
    provideHttpClient(withInterceptors([credentialsInterceptor])),
    {
      provide: APP_INITIALIZER,
      useFactory: (authService: AuthService, housesService: HousesService, router: Router) => () =>
        authService
          .hydrate()
          .toPromise()
          .then((user) => {
            if (user) {
              return housesService.myHouses().toPromise(); // 👈 solo si hay sesión
            }
            return null;
          })
          .catch(() => null)
          .then(() => {
            try {
              router.initialNavigation();
            } catch (e) {}
          }),
      deps: [AuthService, HousesService, Router], // 👈 agrega HousesService
      multi: true,
    },
  ],
};
