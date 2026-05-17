import { Component, OnInit, OnDestroy, inject, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { LucideAngularModule, ArrowLeft, Check, ChevronDown, X, Save } from 'lucide-angular';
import { ProductsService, type ProductResponse } from '../../../../core/services/products.service';
import { PlacesService, type PlaceResponse } from '../../../../core/services/places.service';
import { ItemsService, AddItemToPlaceRequest } from '../../../../core/services/items.service';
import { HousesService } from '../../../../core/services/houses.service';
import { Subject, debounceTime, distinctUntilChanged, takeUntil } from 'rxjs';

interface ProductOption {
  id: string;
  name: string;
}

interface PlaceOption {
  id: string;
  name: string;
}

@Component({
  selector: 'app-add-medicine-form',
  imports: [CommonModule, FormsModule, RouterModule, LucideAngularModule],
  templateUrl: './add-medicine-form.html',
  styleUrl: './add-medicine-form.css',
})
export class AddMedicineForm implements OnInit, OnDestroy {
  private readonly router = inject(Router);
  private readonly housesService = inject(HousesService);
  private readonly productsService = inject(ProductsService);
  private readonly placesService = inject(PlacesService);
  private readonly itemsService = inject(ItemsService);

  private readonly destroy$ = new Subject<void>();
  private readonly searchInput$ = new Subject<string>();

  icons = { arrowLeft: ArrowLeft, check: Check, chevronDown: ChevronDown, x: X, save: Save };

  places: PlaceOption[] = [];

  formData = {
    productId: '',
    placeId: '',
    expirationDate: '',
  };

  // Combobox state
  productSearchText = '';
  selectedProductName = '';
  isDropdownOpen = false;
  isLoadingProducts = false;
  isLoadingMore = false;

  isLoading = false;
  errorMessage = '';

  get products() {
    return this.productsService.products();
  }

  get hasMore() {
    return this.productsService.hasMore();
  }

  ngOnInit() {
    this.loadInitialProducts();
    this.loadPlaces();
    this.setupSearch();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
    this.productsService.clearProducts();
  }

  private setupSearch() {
    this.searchInput$
      .pipe(debounceTime(350), distinctUntilChanged(), takeUntil(this.destroy$))
      .subscribe((term) => {
        this.productsService.clearProducts();
        this.isLoadingProducts = true;
        this.productsService.getProducts(term ? { 'filter[name]': term } : undefined).subscribe({
          next: () => {
            this.isLoadingProducts = false;
          },
          error: () => {
            this.isLoadingProducts = false;
            this.errorMessage = 'No se pudieron cargar los productos.';
          },
        });
      });
  }

  private loadInitialProducts() {
    this.isLoadingProducts = true;
    this.productsService.getProducts().subscribe({
      next: () => {
        this.isLoadingProducts = false;
      },
      error: () => {
        this.isLoadingProducts = false;
        this.errorMessage = 'No se pudieron cargar los productos.';
      },
    });
  }

  loadPlaces() {
    const houseId = this.housesService.house()?.id;
    if (!houseId) {
      this.errorMessage = 'No se encontró una casa asociada.';
      return;
    }
    this.placesService.getPlaces(houseId).subscribe({
      next: () => {
        this.places = this.placesService.places().map((place: PlaceResponse) => ({
          id: place.id,
          name: place.name,
        }));
      },
      error: () => {
        this.errorMessage = 'No se pudieron cargar los lugares.';
      },
    });
  }

  onSearchChange(term: string) {
    this.productSearchText = term;
    // Clear selection if user edits the text
    if (this.formData.productId) {
      this.formData.productId = '';
      this.selectedProductName = '';
    }
    this.searchInput$.next(term);
  }

  openDropdown() {
    this.isDropdownOpen = true;
  }

  selectProduct(product: ProductOption) {
    this.formData.productId = product.id;
    this.selectedProductName = product.name;
    this.productSearchText = product.name;
    this.isDropdownOpen = false;
  }

  clearProduct(event: Event) {
    event.stopPropagation();
    this.formData.productId = '';
    this.selectedProductName = '';
    this.productSearchText = '';
    this.productsService.clearProducts();
    this.loadInitialProducts();
  }

  loadMore() {
    if (this.isLoadingMore) return;
    const obs = this.productsService.loadMore(
      this.productSearchText ? { 'filter[name]': this.productSearchText } : undefined,
    );
    if (!obs) return;
    this.isLoadingMore = true;
    obs.subscribe({
      next: () => {
        this.isLoadingMore = false;
      },
      error: () => {
        this.isLoadingMore = false;
      },
    });
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent) {
    const target = event.target as HTMLElement;
    const combobox = document.getElementById('product-combobox');
    if (combobox && !combobox.contains(target)) {
      this.isDropdownOpen = false;
      if (this.selectedProductName) {
        this.productSearchText = this.selectedProductName;
      }
    }
  }

  saveMedicine() {
    if (!this.formData.productId || !this.formData.placeId || !this.formData.expirationDate) {
      this.errorMessage = 'Selecciona un producto, un lugar y una fecha de vencimiento.';
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';

    const addItemToPlaceRequest: AddItemToPlaceRequest = {
      productId: this.formData.productId,
      expirationDate: new Date(this.formData.expirationDate).toISOString(),
    };

    this.itemsService.addItemToPlace(this.formData.placeId, addItemToPlaceRequest).subscribe({
      next: () => {
        this.isLoading = false;
        this.router.navigate(['/medkit']);
      },
      error: (error) => {
        this.isLoading = false;
        this.errorMessage = 'No se pudo guardar el medicamento. Intenta de nuevo.';
        console.error('Error guardando medicamento:', error);
      },
    });
  }
}
