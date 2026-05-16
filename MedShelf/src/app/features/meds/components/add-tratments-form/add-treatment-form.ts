import { Component, OnInit, OnDestroy, inject, HostListener, signal } from '@angular/core';
import { RouterLink, Router } from '@angular/router';
import { LucideAngularModule, ArrowLeft, Check, ChevronDown, X } from 'lucide-angular';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject, debounceTime, distinctUntilChanged, takeUntil } from 'rxjs';
import { TreatmentsService } from '../../../../core/services/treatments.service';
import { ItemsService } from '../../../../core/services/items.service';
import { ProfilesService, Profile } from '../../../../core/services/profiles.service';

interface ItemOption {
  id: string;
  label: string;
}

@Component({
  selector: 'app-add-treatment-form',
  imports: [RouterLink, LucideAngularModule, CommonModule, FormsModule],
  templateUrl: './add-treatment-form.html',
  styleUrl: './add-treatment-form.css',
})
export class AddTreatmentForm implements OnInit, OnDestroy {
  private readonly router = inject(Router);
  private readonly treatmentsService = inject(TreatmentsService);
  private readonly profilesService = inject(ProfilesService);
  private readonly itemsService = inject(ItemsService);

  private readonly destroy$ = new Subject<void>();
  private readonly searchInput$ = new Subject<string>();

  icons = { arrowLeft: ArrowLeft, check: Check, chevronDown: ChevronDown, x: X };

  // Combobox
  items: ItemOption[] = [];
  itemSearchText = '';
  selectedItemName = '';
  isDropdownOpen = false;
  isLoadingItems = false;
  hasMoreItems = false;

  // Form
  formData = {
    profileId: '',
    itemId: '',
    dose: '',
    frequency: 8,
    startDate: new Date().toISOString().slice(0, 10),
    duration: 7,
  };

  profiles: Profile[] = [];
  isLoadingProfiles = false;
  isLoading = false;
  errorMessage = '';

  ngOnInit(): void {
    this.loadInitialItems();
    this.setupSearch();
    this.loadProfiles();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private setupSearch(): void {
    this.searchInput$
      .pipe(debounceTime(350), distinctUntilChanged(), takeUntil(this.destroy$))
      .subscribe((term) => {
        this.isLoadingItems = true;
        this.itemsService.getItemsByHouse(term ? { 'filter[name]': term } : undefined).subscribe({
          next: (response: any) => {
            this.updateItemsFromResponse(response);
            this.isLoadingItems = false;
          },
          error: () => (this.isLoadingItems = false),
        });
      });
  }

  loadProfiles() {
    this.isLoadingProfiles = true;
    this.profilesService.getProfiles().subscribe({
      next: () => {
        this.profiles = this.profilesService.profiles();
        this.isLoadingProfiles = false;
      },
      error: () => {
        this.isLoadingProfiles = false;
        this.errorMessage = 'No se pudieron cargar los perfiles.';
      },
    });
  }

  loadInitialItems() {
    this.isLoadingItems = true;
    this.itemsService.getItemsByHouse().subscribe({
      next: (response: any) => {
        this.updateItemsFromResponse(response);
        this.isLoadingItems = false;
      },
      error: () => {
        this.items = [];
        this.isLoadingItems = false;
        this.hasMoreItems = false;
      },
    });
  }

  private updateItemsFromResponse(response: any): void {
    const rawItems: any[] = response?.items ?? [];
    this.hasMoreItems = !!response?.nextCursor;
    this.items = rawItems.map((item) => ({
      id: String(item.id),
      label: `${item.product?.name ?? item.id} — ${item.totalContent ?? 0} ${item.unit ?? 'u.'}`,
    }));
  }

  // --- Combobox handlers ---

  onSearchChange(term: string): void {
    this.itemSearchText = term;
    if (this.formData.itemId) {
      this.formData.itemId = '';
      this.selectedItemName = '';
    }
    this.searchInput$.next(term);
  }

  openDropdown(): void {
    this.isDropdownOpen = true;
  }

  selectItem(item: ItemOption): void {
    this.formData.itemId = item.id;
    this.selectedItemName = item.label;
    this.itemSearchText = item.label;
    this.isDropdownOpen = false;
  }

  clearItem(event: Event): void {
    event.stopPropagation();
    this.formData.itemId = '';
    this.selectedItemName = '';
    this.itemSearchText = '';
    this.loadInitialItems();
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    const combobox = document.getElementById('item-combobox');
    if (combobox && !combobox.contains(event.target as HTMLElement)) {
      this.isDropdownOpen = false;
      if (this.selectedItemName) {
        this.itemSearchText = this.selectedItemName;
      }
    }
  }

  // --- Dates & duration ---

  private computeDays(): number {
    const { duration } = this.formData;
    return duration;
  }

  getNextScheduledTimes(): string[] {
    if (!this.formData.startDate || !this.formData.frequency) return [];
    const times: string[] = [];
    const base = new Date(`${this.formData.startDate}T08:00:00`);
    for (let i = 0; i < 3; i++) {
      const t = new Date(base.getTime() + i * this.formData.frequency * 3_600_000);
      times.push(t.toISOString().slice(11, 16));
    }
    return times;
  }

  // --- Submit ---

  saveTreatment(): void {
    this.errorMessage = '';

    if (!this.formData.profileId) {
      this.errorMessage = 'Selecciona un perfil.';
      return;
    }
    if (!this.formData.itemId || !this.formData.dose) {
      this.errorMessage = 'Completa todos los campos requeridos.';
      return;
    }
    console.log('Guardando tratamiento con datos:', this.formData);

    this.isLoading = true;

    this.treatmentsService
      .createTreatment(this.formData.profileId, {
        itemId: this.formData.itemId,
        dose: Number(this.formData.dose),
        frequencyHours: this.formData.frequency,
        startDate: this.formData.startDate,
        days: this.computeDays(),
      })
      .subscribe({
        next: () => {
          this.isLoading = false;
          this.router.navigate(['/meds']);
        },
        error: (err) => {
          this.isLoading = false;
          this.errorMessage = 'No se pudo guardar el tratamiento. Intenta de nuevo.';
          console.error(err);
        },
      });
  }
}
