import { Routes } from '@angular/router';
import { MainLayout } from './core/layouts/main-layout/main-layout';
import { Home } from './features/home/home';
import { Medkit } from './features/medkit/medkit';
import { Login } from './features/auth/login/login';
import { Register } from './features/auth/register/register';
import { Profile } from './features/profile/profile';
import { EditProfile } from './features/profile/components/edit-profile/edit-profile';
import { AddFamily } from './features/profile/components/add-family/add-family';
import { AddLocation } from './features/home/components/add-location/add-location';
import { Meds } from './features/meds/meds';
import { AddMedicineForm } from './features/medkit/components/add-medicine-form/add-medicine-form';
import { AddTreatmentForm } from './features/meds/components/add-tratments-form/add-treatment-form';
import { authGuard } from './core/guards/auth.guard';
import { guestGuard } from './core/guards/guest.guard';

export const routes: Routes = [
  {
    path: '',
    component: MainLayout,
    canActivate: [authGuard], // 👈 protege todo el layout de una vez
    children: [
      { path: '', component: Home },
      { path: 'add-location', component: AddLocation },
      {
        path: 'medkit',
        children: [
          { path: '', component: Medkit },
          { path: 'add-medicine', component: AddMedicineForm },
        ],
      },
      {
        path: 'profile',
        children: [
          { path: '', component: Profile },
          { path: 'edit', component: EditProfile },
          { path: 'add-family', component: AddFamily },
        ],
      },
      {
        path: 'meds',
        children: [
          { path: '', component: Meds },
          { path: 'add-treatment', component: AddTreatmentForm },
        ],
      },
    ],
  },
  { path: 'login', component: Login, canActivate: [guestGuard] }, // 👈
  { path: 'register', component: Register, canActivate: [guestGuard] }, // 👈
];
