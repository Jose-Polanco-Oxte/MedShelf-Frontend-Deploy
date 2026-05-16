import { Component, OnInit } from '@angular/core';
import { RouterLink, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule, ArrowLeft, Save } from 'lucide-angular';

interface ProfileData {
  name: string;
  age: number;
  bloodtype: string;
  alergies: string[];
  email: string;
  phone: string;
  address: string;
}

@Component({
  selector: 'app-edit-profile',
  imports: [RouterLink, CommonModule, FormsModule, LucideAngularModule],
  templateUrl: './edit-profile.html',
  styleUrl: './edit-profile.css',
})
export class EditProfile implements OnInit {
  icons = { arrowLeft: ArrowLeft, save: Save };
  
  profileData: ProfileData = {
    name: 'John Doe',
    age: 30,
    bloodtype: 'O+',
    alergies: ['Peanuts', 'Shellfish'],
    email: 'john@doe.com',
    phone: '123-456-7890',
    address: '123 Main St, Anytown, USA',
  };

  allergyInput: string = '';
  bloodTypes = ['O+', 'O-', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-'];

  constructor(private router: Router) {}

  ngOnInit() {
    // Simulado - En un caso real, obtendríamos del servicio
    this.loadProfile();
  }

  loadProfile() {
    // Simulando datos del localStorage o un servicio
    const savedProfile = localStorage.getItem('userProfile');
    if (savedProfile) {
      this.profileData = JSON.parse(savedProfile);
    }
  }

  addAllergy() {
    if (this.allergyInput.trim() && !this.profileData.alergies.includes(this.allergyInput.trim())) {
      this.profileData.alergies.push(this.allergyInput.trim());
      this.allergyInput = '';
    }
  }

  removeAllergy(index: number) {
    this.profileData.alergies.splice(index, 1);
  }

  saveProfile() {
    // Simulando guardado en backend
    localStorage.setItem('userProfile', JSON.stringify(this.profileData));
    alert(`✓ Perfil actualizado\n${this.profileData.name}, ${this.profileData.age} años`);
    this.router.navigate(['/profile']);
  }

  cancel() {
    this.router.navigate(['/profile']);
  }
}
