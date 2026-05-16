import { Component, inject, OnInit } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { LucideAngularModule, House, BriefcaseMedical, Pill, User } from 'lucide-angular';
import { ThemeService } from '../../services/theme.service';

@Component({
  selector: 'app-navbar',
  imports: [RouterLink, RouterLinkActive, LucideAngularModule],
  templateUrl: './navbar.html',
  styleUrl: './navbar.css',
})
export class Navbar implements OnInit {
  private themeService = inject(ThemeService);

  ngOnInit() {
    // Suscribirse a cambios de tema para forzar detección de cambios de Angular
    this.themeService.theme$.subscribe();
  }
  icons = {
    home: House,
    dashboard: BriefcaseMedical,
    meds: Pill,
    profile: User,
  };
}
