import { Component, OnInit, OnDestroy, inject, HostListener, signal, ChangeDetectorRef } from '@angular/core';
import { RouterLink, Router } from '@angular/router';
import { LucideAngularModule, ArrowLeft, Save, ChevronDown, X } from 'lucide-angular';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject, debounceTime, distinctUntilChanged, takeUntil } from 'rxjs';
import { TreatmentsService } from '../../../../core/services/treatments.service';
import { ItemsService } from '../../../../core/services/items.service';
import { ProfilesService, Profile } from '../../../../core/services/profiles.service';
import { ProductsService } from '../../../../core/services/products.service';

interface ItemOption {
  id: string;
  label: string;
}

interface Medicine {
  id: string;
  name: string;
  quantity: number;
  unit: string;
  dosage: string;
  expiryDate: Date;
  status: 'valid' | 'expiringNext' | 'expired';
  instructions?: string;
  selected?: boolean;
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
  private readonly productsService = inject(ProductsService);
  private readonly cdr = inject(ChangeDetectorRef);

  private readonly destroy$ = new Subject<void>();
  private readonly searchInput$ = new Subject<string>();

  icons = { arrowLeft: ArrowLeft, save: Save, chevronDown: ChevronDown, x: X };

  // Combobox
  medicines = signal<Medicine[]>([]);
  filteredMedicines = signal<Medicine[]>([]);

  items: ItemOption[] = [];
  itemSearchText = '';
  selectedItemName = '';
  isDropdownOpen = false;
  isLoadingProducts = false;
  isLoadingItems = false;
  hasMoreItems = false;
  searchTerm = signal('');

  // Form
  formData = {
    profileId: '',
    productId: '',
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
    this.loadInitialProducts();
    this.setupSearch();
    this.loadProfiles();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  setupSearch(): void {
    this.searchInput$
      .pipe(debounceTime(350), distinctUntilChanged(), takeUntil(this.destroy$))
      .subscribe((term) => {
        this.isLoadingItems = true;
        this.productsService.getProducts(term ? { 'filter[name]': term } : undefined).subscribe({
          next: () => {
            this.updateProductsFromService();
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
        this.cdr.detectChanges();
      },
      error: () => {
        this.isLoadingProfiles = false;
        this.errorMessage = 'No se pudieron cargar los perfiles.';
        this.cdr.detectChanges();
      },
    });
  }

  loadInitialProducts() {
    this.isLoadingProducts = true;
    this.productsService.getProducts().subscribe({
      next: () => {
        this.updateProductsFromService();
        this.isLoadingProducts = false;
      },
      error: () => {
        this.isLoadingProducts = false;
        this.errorMessage = 'No se pudieron cargar los productos.';
      },
    });
  }

  loadMoreProducts() {
    if (this.isLoadingItems) return;
    this.isLoadingItems = true;
    const obs = this.productsService.loadMore(
      this.itemSearchText ? { 'filter[name]': this.itemSearchText } : undefined,
    );
    if (!obs) {
      this.isLoadingItems = false;
      return;
    }
    obs.subscribe({
      next: () => {
        this.updateProductsFromService();
        this.isLoadingItems = false;
      },
      error: () => {
        this.isLoadingItems = false;
      },
    });
  }

  getMedicineStatus(expiryDate: Date): Medicine['status'] {
    const now = new Date();
    const diffInDays = Math.ceil((expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    if (diffInDays < 0) return 'expired';
    if (diffInDays <= 30) return 'expiringNext';
    return 'valid';
  }

  private updateItemsFromResponse(response: any): void {
    // keep for backwards compatibility (not used currently)
    const rawItems: any[] = response?.items ?? [];
    this.hasMoreItems = !!response?.nextCursor;
    this.items = rawItems.map((item) => ({
      id: String(item.id),
      label: `${item.product?.name ?? item.id} — ${item.totalContent ?? 0} ${item.unit ?? 'u.'}`,
    }));
  }

  private updateProductsFromService(): void {
    const products = this.productsService.products();
    this.hasMoreItems = this.productsService.hasMore();
    this.items = products.map((p: any) => ({ id: p.id, label: `${p.name} — ${p.units ?? ''}` }));
  }

  // --- Combobox handlers ---

  onSearchChange(term: string): void {
    this.itemSearchText = term;
    if (this.formData.productId) {
      this.formData.productId = '';
      this.selectedItemName = '';
    }
    this.searchInput$.next(term);
  }

  openDropdown(): void {
    this.isDropdownOpen = true;
  }

  selectItem(item: ItemOption): void {
    this.formData.productId = item.id;
    this.selectedItemName = item.label;
    this.itemSearchText = item.label;
    this.isDropdownOpen = false;
  }

  clearItem(event: Event): void {
    event.stopPropagation();
    this.formData.productId = '';
    this.selectedItemName = '';
    this.itemSearchText = '';
    this.loadInitialProducts();
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
    if (!this.formData.productId || !this.formData.dose) {
      this.errorMessage = 'Completa todos los campos requeridos.';
      return;
    }
    console.log('Guardando tratamiento con datos:', this.formData);

    this.isLoading = true;

    this.treatmentsService
      .createTreatment(this.formData.profileId, {
        productId: this.formData.productId,
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
