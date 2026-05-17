import { Component, inject, ChangeDetectorRef, ViewChild, ElementRef } from '@angular/core';
import { RouterLink, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule, ArrowLeft, Save, Loader, CheckCircle, TriangleAlert } from 'lucide-angular';
import { ProfilesService } from '../../../../core/services/profiles.service';

interface FamilyMember {
  name: string;
  relation: string;
  birthDate: string;
  allergies: string[];
}

@Component({
  selector: 'app-add-family',
  imports: [RouterLink, CommonModule, FormsModule, LucideAngularModule],
  templateUrl: './add-family.html',
  styleUrl: './add-family.css',
})
export class AddFamily {
  private profilesService = inject(ProfilesService);
  private router = inject(Router);
  private cdr = inject(ChangeDetectorRef);

  @ViewChild('birthDateInput') birthDateInput!: ElementRef<HTMLInputElement>;

  icons = { arrowLeft: ArrowLeft, save: Save, loader: Loader, checkCircle: CheckCircle, warning: TriangleAlert };

  familyData: FamilyMember = {
    name: '',
    relation: '',
    birthDate: '',
    allergies: [],
  };

  allergyInput: string = '';
  relations = ['Madre', 'Padre', 'Hijo/a', 'Hermano/a', 'Abuelo/a', 'Tío/a', 'Otro'];
  isLoading = false;
  toastMessage = '';
  isToastExiting = false;
  isErrorToast = false;
  private toastTimeoutId: any;

  // Sin límite de 18 años: la familia puede incluir menores
  get maxBirthDate(): string {
    return new Date().toISOString().split('T')[0];
  }

  openDatePicker() {
    this.birthDateInput?.nativeElement?.showPicker();
  }

  addAllergy() {
    if (this.allergyInput.trim() && !this.familyData.allergies.includes(this.allergyInput.trim())) {
      this.familyData.allergies.push(this.allergyInput.trim());
      this.allergyInput = '';
    }
  }

  removeAllergy(index: number) {
    this.familyData.allergies.splice(index, 1);
  }

  addFamilyMember() {
    if (!this.familyData.name.trim() || !this.familyData.relation || !this.familyData.birthDate) {
      this.showError('Por favor completa al menos el nombre, la relación y la fecha de nacimiento');
      return;
    }

    this.isLoading = true;
    this.profilesService.createProfile({
      name: this.familyData.name,
      birthDate: this.familyData.birthDate,
      allergies: this.familyData.allergies,
    }).subscribe({
      next: () => {
        this.isLoading = false;
        this.showSuccess('Miembro de familia agregado exitosamente');
        setTimeout(() => this.router.navigate(['/account']), 1500);
      },
      error: (error) => {
        this.isLoading = false;
        console.error('Error al agregar miembro:', error);
        const errorMsg = error.error?.message || error.message || 'Error desconocido';
        this.showError(`Error al agregar el miembro de familia: ${errorMsg}`);
      },
    });
  }

  cancel() {
    this.router.navigate(['/account']);
  }

  private showSuccess(message: string) {
    if (this.toastTimeoutId) clearTimeout(this.toastTimeoutId);
    this.toastMessage = message;
    this.isErrorToast = false;
    this.isToastExiting = false;
    this.cdr.detectChanges();
    this.toastTimeoutId = setTimeout(() => this.closeToast(), 4000);
  }

  private showError(message: string) {
    if (this.toastTimeoutId) clearTimeout(this.toastTimeoutId);
    this.toastMessage = message;
    this.isErrorToast = true;
    this.isToastExiting = false;
    this.cdr.detectChanges();
    this.toastTimeoutId = setTimeout(() => this.closeToast(), 4000);
  }

  closeToast() {
    if (this.toastTimeoutId) clearTimeout(this.toastTimeoutId);
    this.isToastExiting = true;
    this.cdr.detectChanges();
    setTimeout(() => {
      this.toastMessage = '';
      this.isToastExiting = false;
      this.isErrorToast = false;
      this.cdr.detectChanges();
    }, 300);
  }
}