import { Component } from '@angular/core';
import { RouterLink, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule, ArrowLeft, Save } from 'lucide-angular';

interface FamilyMember {
  name: string;
  relation: string;
  age: number;
  bloodtype: string;
  alergies: string[];
}

@Component({
  selector: 'app-add-family',
  imports: [RouterLink, CommonModule, FormsModule, LucideAngularModule],
  templateUrl: './add-family.html',
  styleUrl: './add-family.css',
})
export class AddFamily {
  icons = { arrowLeft: ArrowLeft, save: Save };

  familyData: FamilyMember = {
    name: '',
    relation: '',
    age: 0,
    bloodtype: '',
    alergies: [],
  };

  allergyInput: string = '';
  relations = ['Madre', 'Padre', 'Hijo/a', 'Hermano/a', 'Abuelo/a', 'Tío/a', 'Otro'];
  bloodTypes = ['O+', 'O-', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-'];

  constructor(private router: Router) {}

  addAllergy() {
    if (this.allergyInput.trim() && !this.familyData.alergies.includes(this.allergyInput.trim())) {
      this.familyData.alergies.push(this.allergyInput.trim());
      this.allergyInput = '';
    }
  }

  removeAllergy(index: number) {
    this.familyData.alergies.splice(index, 1);
  }

  addFamilyMember() {
    if (!this.familyData.name.trim() || !this.familyData.relation) {
      alert('Por favor completa al menos el nombre y la relación');
      return;
    }

    // Simulando guardado en backend
    const familyMembers = JSON.parse(localStorage.getItem('familyMembers') || '[]');
    familyMembers.push({
      ...this.familyData,
      id: Date.now(),
      initials: this.generateInitials(this.familyData.name),
    });
    localStorage.setItem('familyMembers', JSON.stringify(familyMembers));

    alert(`✓ Miembro de familia agregado\n${this.familyData.name} - ${this.familyData.relation}`);
    this.router.navigate(['/profile']);
  }

  generateInitials(name: string): string {
    return name
      .split(' ')
      .map((word) => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  }

  cancel() {
    this.router.navigate(['/profile']);
  }
}
