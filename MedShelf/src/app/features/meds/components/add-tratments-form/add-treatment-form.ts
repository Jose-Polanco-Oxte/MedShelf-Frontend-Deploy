import { Component, OnInit, OnDestroy, inject, HostListener } from '@angular/core';
import { RouterLink, Router } from '@angular/router';
import { LucideAngularModule, ArrowLeft, Check, ChevronDown, X } from 'lucide-angular';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject, debounceTime, distinctUntilChanged, takeUntil } from 'rxjs';
import { TreatmentsService } from '../../../../core/services/treatments.service';
import { ItemsService } from '../../../../core/services/items.service'; // ajusta si ItemResponse no es exportado
import { HousesService } from '../../../../core/services/houses.service';
import { ProfilesService, ProfileResponse } from '../../../../core/services/profiles.service';

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
  private readonly housesService = inject(HousesService);

  private readonly destroy$ = new Subject<void>();
  private readonly searchInput$ = new Subject<string>();

  icons = { arrowLeft: ArrowLeft, check: Check, chevronDown: ChevronDown, x: X };

  // Combobox items
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
    frequencyValue: 8,
    startTime: '08:00',
    duration: 7,
    durationUnit: 'days' as 'days' | 'weeks' | 'months',

    doseQuantity: '',
  };

  profiles: ProfileResponse[] = [];
  isLoadingProfiles = false;

  isLoading = false;
  errorMessage = '';

  ngOnInit() {
    this.loadInitialItems();
    this.setupSearch();
    this.loadProfiles();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private setupSearch() {
    this.searchInput$
      .pipe(debounceTime(350), distinctUntilChanged(), takeUntil(this.destroy$))
      .subscribe((term) => {
        this.isLoadingItems = true;
        this.itemsService.getItemsByHouse(term ? { 'filter[name]': term } : undefined).subscribe({
          next: () => {
            this.mapItems();
            this.isLoadingItems = false;
          },
          error: () => {
            this.isLoadingItems = false;
          },
        });
      });
  }

  loadProfiles() {
    this.isLoadingProfiles = true;
    this.profilesService.getProfiles().subscribe({
      next: () => {
        this.profiles = this.profilesService.profiles();
        this.isLoadingProfiles = false;
        console.log(this.profiles);
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
      next: () => {
        this.mapItems();
        this.isLoadingItems = false;
      },
      error: () => {
        this.isLoadingItems = false;
        this.errorMessage = 'No se pudieron cargar los medicamentos.';
      },
    });
  }

  private mapItems() {
    const response = this.itemsService.items();
    this.hasMoreItems = !!response.nextCursor;
    this.items = response.items.map((item) => ({
      id: item.id,
      label: `Item ${item.id.slice(0, 8)}... — ${item.totalContent} unidades`,
    }));
  }

  onSearchChange(term: string) {
    this.itemSearchText = term;
    if (this.formData.itemId) {
      this.formData.itemId = '';
      this.selectedItemName = '';
    }
    this.searchInput$.next(term);
  }

  openDropdown() {
    this.isDropdownOpen = true;
  }

  selectItem(item: ItemOption) {
    this.formData.itemId = item.id;
    this.selectedItemName = item.label;
    this.itemSearchText = item.label;
    this.isDropdownOpen = false;
  }

  clearItem(event: Event) {
    event.stopPropagation();
    this.formData.itemId = '';
    this.selectedItemName = '';
    this.itemSearchText = '';
    this.loadInitialItems();
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent) {
    const target = event.target as HTMLElement;
    const combobox = document.getElementById('item-combobox');
    if (combobox && !combobox.contains(target)) {
      this.isDropdownOpen = false;
      if (this.selectedItemName) {
        this.itemSearchText = this.selectedItemName;
      }
    }
  }

  getNextScheduledTimes(): string[] {
    if (!this.formData.startTime || !this.formData.frequencyValue) return [];
    const times: string[] = [];
    const [h, m] = this.formData.startTime.split(':').map(Number);
    let current = h;
    for (let i = 0; i < 3; i++) {
      times.push(`${String(current % 24).padStart(2, '0')}:${String(m).padStart(2, '0')}`);
      current += this.formData.frequencyValue;
    }
    return times;
  }

  private computeDates(): { startDate: string; endDate: string } {
    const now = new Date();
    const [h, m] = this.formData.startTime.split(':').map(Number);
    now.setHours(h, m, 0, 0);
    const startDate = now.toISOString();

    const end = new Date(now);
    if (this.formData.durationUnit === 'days') end.setDate(end.getDate() + this.formData.duration);
    if (this.formData.durationUnit === 'weeks')
      end.setDate(end.getDate() + this.formData.duration * 7);
    if (this.formData.durationUnit === 'months')
      end.setMonth(end.getMonth() + this.formData.duration);
    const endDate = end.toISOString();

    return { startDate, endDate };
  }

  saveTreatment() {
    const profileId = this.formData.profileId;
    if (!profileId) {
      this.errorMessage = 'Selecciona un perfil.';
      return;
    }
    if (!this.formData.itemId || !this.formData.doseQuantity) {
      this.errorMessage = 'Completa todos los campos requeridos.';
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';

    const { startDate, endDate } = this.computeDates();

    this.treatmentsService
      .createTreatment({
        profileId,
        itemId: this.formData.itemId,
        frequencyValue: this.formData.frequencyValue,
        frequencyUnit: 'hours',
        doseQuantity: Number(this.formData.doseQuantity),
        startDate,
        endDate,
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
