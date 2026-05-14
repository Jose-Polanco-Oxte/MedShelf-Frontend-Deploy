import { Component, OnInit, HostListener, ElementRef, ViewChild, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ThemeService } from '../../shared/services/theme.service';
import { signal } from '@angular/core';
import {
  Clock4,
  LucideAngularModule,
  Plus,
  ThumbsUp,
  TriangleAlert,
  Trash,
  Pencil,
  CheckSquare,
  CircleCheck,
  MoreVertical,
} from 'lucide-angular';
import { ItemsService } from '../../core/services/items.service';

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
  selector: 'app-medkit',
  imports: [CommonModule, FormsModule, RouterLink, LucideAngularModule],
  templateUrl: './medkit.html',
  styleUrl: './medkit.css',
})
export class Medkit implements OnInit {
  @ViewChild('userDropdown') userDropdown!: ElementRef;
  private themeService = inject(ThemeService);
  private itemsService = inject(ItemsService);

  icons = {
    thumbsUp: ThumbsUp,
    clock: Clock4,
    alert: TriangleAlert,
    plus: Plus,
    trash: Trash,
    pencil: Pencil,
    checkSquare: CheckSquare,
    circleCheck: CircleCheck,
    moreVertical: MoreVertical,
  };

  // 👇 signals en lugar de arrays mutables
  medicines = signal<Medicine[]>([]);
  filteredMedicines = signal<Medicine[]>([]);
  searchTerm = signal('');

  expired = signal(0);
  expiringNext = signal(0);
  valid = signal(0);

  showUserMenu = signal(false);
  openMedDropdowns = signal<Set<string>>(new Set());
  selectedMedicinesCount = signal(0);

  ngOnInit() {
    this.themeService.theme$.subscribe();
    this.loadMedicines();
  }

  @HostListener('document:click')
  closeAllDropdowns() {
    this.openMedDropdowns.set(new Set());
    this.showUserMenu.set(false);
  }

  loadMedicines() {
    this.itemsService.getItemsByHouse().subscribe({
      next: (response: any) => {
        const items = response?.items ?? [];
        const mapped = items.map((item: any) => this.mapItemToMedicine(item));
        this.medicines.set(mapped);
        this.filteredMedicines.set(mapped);
        this.calculateStatistics();
      },
      error: () => {
        this.medicines.set([]);
        this.filteredMedicines.set([]);
        this.calculateStatistics();
      },
    });
  }

  mapItemToMedicine(item: any): Medicine {
    const expiryDate = new Date(item.expirationDate ?? Date.now());
    const status = this.getMedicineStatus(expiryDate);
    const productName = item.product?.name ?? item.product?.id ?? `Medicamento ${item.id}`;
    return {
      id: String(item.id),
      name: productName,
      quantity: Number(item.totalContent ?? 0),
      unit: item.unit ?? 'unidades',
      dosage: item.dosage ?? 'Sin dosis registrada',
      expiryDate,
      status,
      instructions: item.instructions ?? '',
    };
  }

  getMedicineStatus(expiryDate: Date): Medicine['status'] {
    const now = new Date();
    const diffInDays = Math.ceil((expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    if (diffInDays < 0) return 'expired';
    if (diffInDays <= 30) return 'expiringNext';
    return 'valid';
  }

  calculateStatistics() {
    const meds = this.medicines();
    this.expired.set(meds.filter((m) => m.status === 'expired').length);
    this.expiringNext.set(meds.filter((m) => m.status === 'expiringNext').length);
    this.valid.set(meds.filter((m) => m.status === 'valid').length);
  }

  filterMedicines() {
    const term = this.searchTerm().toLowerCase().trim();
    if (!term) {
      this.filteredMedicines.set([...this.medicines()]);
    } else {
      this.filteredMedicines.set(
        this.medicines().filter(
          (med) =>
            med.name.toLowerCase().includes(term) || med.instructions?.toLowerCase().includes(term),
        ),
      );
    }
  }

  toggleMedDropdown(medicineId: string) {
    const current = new Set(this.openMedDropdowns());
    if (current.has(medicineId)) {
      current.delete(medicineId);
    } else {
      current.add(medicineId);
    }
    this.openMedDropdowns.set(current);
  }

  isMedDropdownOpen(medicineId: string) {
    return this.openMedDropdowns().has(medicineId);
  }

  isMedicineSelected(medicineId: string) {
    return this.medicines().some((m) => m.id === medicineId && m.selected);
  }

  toggleSelectMedicine(medicineId: string) {
    this.medicines.update((meds) =>
      meds.map((m) => (m.id === medicineId ? { ...m, selected: !m.selected } : m)),
    );
    this.selectedMedicinesCount.set(this.medicines().filter((m) => m.selected).length);
  }

  clearSelection() {
    this.medicines.update((meds) => meds.map((m) => ({ ...m, selected: false })));
    this.selectedMedicinesCount.set(0);
  }

  deleteSelectedMedicines() {
    this.medicines()
      .filter((m) => m.selected)
      .forEach((m) => this.deleteMedicine(m.id));
    this.clearSelection();
  }

  editMedicine(medicineId: string) {
    console.log('Editar medicamento:', medicineId);
  }

  deleteMedicine(medicineId: string) {
    this.itemsService.deleteItem(medicineId).subscribe({
      next: () => this.loadMedicines(),
      error: (error) => console.error('Error eliminando medicamento:', error),
    });
  }
}
