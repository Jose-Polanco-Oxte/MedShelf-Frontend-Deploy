import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { LucideAngularModule, Plus, ChevronDown, ArrowLeft } from 'lucide-angular';
import { RouterLink } from '@angular/router';
import { TreatmentsService, TreatmentResponse } from '../../core/services/treatments.service';
import { ProfilesService } from '../../core/services/profiles.service';
import { ItemsService } from '../../core/services/items.service';
import { ConsumptionsService } from '../../core/services/consumptions.service';
import { signal } from '@angular/core';

@Component({
  selector: 'app-meds',
  imports: [CommonModule, LucideAngularModule, RouterLink],
  templateUrl: './meds.html',
  styleUrl: './meds.css',
})
export class Meds implements OnInit {
  private readonly treatmentsService = inject(TreatmentsService);
  private readonly profilesService = inject(ProfilesService);
  private readonly itemsService = inject(ItemsService);
  private readonly consumptionsService = inject(ConsumptionsService);

  icons = { plus: Plus, chevronDown: ChevronDown, arrowLeft: ArrowLeft };
  isLoading = false;
  errorMessage = '';
  treatments = signal<TreatmentResponse[]>([]);
  expandedId = signal<string | null>(null);

  // map de treatmentId -> item detail
  itemDetails = signal<Record<string, any>>({});

  get activeTreatments(): TreatmentResponse[] {
    return this.treatments().filter((t) => t.status === 'active');
  }

  get hasMore(): boolean {
    return this.treatmentsService.hasMore();
  }

  ngOnInit(): void {
    this.loadTreatments();
  }

  isActive(treatment: TreatmentResponse): boolean {
    return treatment.status === 'active';
  }

  loadTreatments(): void {
    this.isLoading = true;
    this.treatmentsService.getAllTreatments().subscribe({
      next: () => {
        this.treatments.set(this.treatmentsService.treatments());
        this.isLoading = false;
      },
      error: () => {
        this.errorMessage = 'Error al cargar los tratamientos';
        this.isLoading = false;
      },
    });
  }

  loadTreatmentsByProfile(profileId: string): void {
    this.isLoading = true;
    this.treatmentsService.getTreatmentsByProfile(profileId).subscribe({
      next: () => {
        this.treatments.set(this.treatmentsService.treatments());
        this.isLoading = false;
      },
      error: () => {
        this.errorMessage = 'Error al cargar los tratamientos por perfil';
        this.isLoading = false;
      },
    });
  }

  toggleExpand(treatment: TreatmentResponse): void {
    const treatmentId = treatment.id;

    // colapsar si ya está abierto
    if (this.expandedId() === treatmentId) {
      this.expandedId.set(null);
      return;
    }

    // si ya tenemos el detalle cacheado, solo expandir
    if (this.itemDetails()[treatmentId]) {
      this.expandedId.set(treatmentId);
      return;
    }

    // cargar detalle del item y guardar bajo treatmentId
    this.itemsService.getItemDetails(treatment.item.id).subscribe({
      next: (item) => {
        this.itemDetails.update((prev) => ({ ...prev, [treatmentId]: item }));
        this.expandedId.set(treatmentId);
      },
      error: () => {
        this.errorMessage = 'Error al cargar los detalles del medicamento';
      },
    });
  }

  registerConsumption(itemId: string, amount: number): void {
    this.consumptionsService.addConsumption(itemId, amount).subscribe({
      next: () => {
        this.loadTreatments();
      },
      error: () => {
        this.errorMessage = 'Error al registrar el consumo';
      },
    });
  }
}
