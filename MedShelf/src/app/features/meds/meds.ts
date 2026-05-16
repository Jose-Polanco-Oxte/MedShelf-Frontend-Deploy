import { NgClass, CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { LucideAngularModule, Plus } from 'lucide-angular';
import { RouterLink } from '@angular/router';
import { TreatmentsService, TreatmentResponse } from '../../core/services/treatments.service';

@Component({
  selector: 'app-meds',
  imports: [NgClass, CommonModule, LucideAngularModule, RouterLink],
  templateUrl: './meds.html',
  styleUrl: './meds.css',
})
export class Meds implements OnInit {
  private readonly treatmentsService = inject(TreatmentsService);

  icons = { plus: Plus };

  isLoading = false;
  errorMessage = '';

  get treatments() {
    return this.treatmentsService.treatments();
  }

  get hasMore() {
    return this.treatmentsService.hasMore();
  }

  ngOnInit() {
    this.loadTreatments();
  }

  loadTreatments() {
    this.isLoading = true;
    this.treatmentsService.getTreatments().subscribe({
      next: () => {
        this.isLoading = false;
      },
      error: () => {
        this.isLoading = false;
        this.errorMessage = 'No se pudieron cargar los tratamientos.';
      },
    });
  }

  loadMore() {
    const obs = this.treatmentsService.loadMore();
    if (!obs) return;
    obs.subscribe();
  }

  formatFrequency(treatment: TreatmentResponse): string {
    return `${treatment.doseQuantity} dosis • Cada ${treatment.frequencyValue} ${treatment.frequencyUnit}`;
  }

  isActive(treatment: TreatmentResponse): boolean {
    return treatment.status === 'active';
  }
}
