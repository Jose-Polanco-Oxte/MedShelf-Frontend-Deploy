import { Injectable, signal, effect } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { AuthService } from '../../core/services/auth.service';

export type Theme = 'light' | 'dark';

@Injectable({
  providedIn: 'root'
})
export class ThemeService {
  private readonly THEME_KEY_PREFIX = 'medshelf-theme-user-';
  private readonly DEFAULT_THEME_KEY = 'medshelf-theme-default';
  private themeSignal = signal<Theme>(this.getInitialTheme());
  public theme$ = new BehaviorSubject<Theme>(this.themeSignal());

  constructor(private authService: AuthService) {
    // Efecto para aplicar cambios de tema
    effect(() => {
      const theme = this.themeSignal();
      this.applyTheme(theme);
      this.theme$.next(theme);
      this.saveCurrentTheme(theme);
    });

    // Escuchar cambios del usuario autenticado
    effect(() => {
      const user = this.authService.currentUser();
      if (user) {
        // Usuario logueado: cargar su tema preferido
        this.loadUserTheme(user.id);
      } else {
        // Usuario no logueado: volver a tema predeterminado
        this.resetToDefaultTheme();
      }
    });
  }

  private getInitialTheme(): Theme {
    // Al iniciar, usar tema predeterminado (claro)
    // A menos que haya un usuario logueado, lo que se manejará en el effect
    return 'light';
  }

  private applyTheme(theme: Theme) {
    const htmlElement = document.documentElement;
    htmlElement.setAttribute('data-theme', theme);
  }

  private saveCurrentTheme(theme: Theme) {
    const user = this.authService.currentUser();
    if (user) {
      // Si hay usuario logueado, guardar con su ID
      localStorage.setItem(`${this.THEME_KEY_PREFIX}${user.id}`, theme);
    } else {
      // Si no hay usuario, guardar como tema predeterminado
      localStorage.setItem(this.DEFAULT_THEME_KEY, theme);
    }
  }

  private loadUserTheme(userId: string) {
    const userTheme = localStorage.getItem(`${this.THEME_KEY_PREFIX}${userId}`) as Theme | null;
    if (userTheme) {
      this.themeSignal.set(userTheme);
    } else {
      // Si el usuario no tiene un tema guardado, usar predeterminado
      this.themeSignal.set('light');
    }
  }

  private resetToDefaultTheme() {
    // Cuando se cierra sesión, volver al tema predeterminado (light)
    this.themeSignal.set('light');
  }

  getCurrentTheme() {
    return this.themeSignal();
  }

  toggleTheme() {
    const currentTheme = this.themeSignal();
    const newTheme = currentTheme === 'light' ? 'dark' : 'light';
    this.themeSignal.set(newTheme);
  }

  setTheme(theme: Theme) {
    this.themeSignal.set(theme);
  }
}