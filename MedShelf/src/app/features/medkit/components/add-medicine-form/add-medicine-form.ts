import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { LucideAngularModule, ArrowLeft, Check } from 'lucide-angular';
import { ProductsService, type ProductResponse } from '../../../../core/services/products.service';
import { PlacesService, type PlaceResponse } from '../../../../core/services/places.service';
import { ItemsService } from '../../../../core/services/items.service';
import { AddItemToPlaceRequest } from '../../../../core/services/items.service';
import { HousesService } from '../../../../core/services/houses.service';

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
export class AddMedicineForm implements OnInit {
  private readonly router = inject(Router);
  private readonly housesService = inject(HousesService);
  private readonly productsService = inject(ProductsService);
  private readonly placesService = inject(PlacesService);
  private readonly itemsService = inject(ItemsService);
  private cdr = inject(ChangeDetectorRef);

  icons = { arrowLeft: ArrowLeft, check: Check };

  products: ProductOption[] = [];
  places: PlaceOption[] = [];

  formData = {
    productId: '',
    placeId: '',
    expirationDate: '',
  };

  isLoading = false;
  errorMessage = '';

  ngOnInit() {
    this.loadProducts();
    this.loadPlaces();
  }

  loadProducts() {
    this.productsService.getProducts().subscribe({
      next: () => {
        this.products = this.productsService.products().map((product: ProductResponse) => ({
          id: product.id,
          name: product.name,
        }));
      },
      error: (error) => {
        console.error('Error cargando productos:', error);
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
      error: (error) => {
        console.error('Error cargando lugares:', error);
        this.errorMessage = 'No se pudieron cargar los lugares.';
      },
    });
  }

  saveMedicine() {
    if (!this.formData.productId || !this.formData.placeId || !this.formData.expirationDate) {
      this.errorMessage = 'Selecciona un producto, un lugar y una fecha de vencimiento.';
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';

    const expirationDate = new Date(this.formData.expirationDate).toISOString();

    const addItemToPlaceRequest: AddItemToPlaceRequest = {
      productId: this.formData.productId,
      expirationDate,
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
