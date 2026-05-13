import {
  ApplicationConfig,
  provideBrowserGlobalErrorListeners,
  APP_INITIALIZER,
} from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { withInterceptors } from '@angular/common/http';
import { credentialsInterceptor } from './core/interceptors/credentials.interceptor';
import { AuthService } from './core/services/auth.service';
import { routes } from './app.routes';
import { Router } from '@angular/router';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
    provideHttpClient(withInterceptors([credentialsInterceptor])),
    {
      provide: APP_INITIALIZER,
      useFactory: (authService: AuthService, router: Router) => () =>
        authService
          .hydrate()
          .toPromise()
          .catch(() => null)
          .then(() => {
            try {
              router.initialNavigation();
            } catch (e) {
              // ignore if router already navigated
            }
          }),
      deps: [AuthService, Router],
      multi: true,
    },
  ],
};
