import { Routes } from '@angular/router';
import { MainLayout } from './core/layouts/main-layout/main-layout';
import { Home } from './features/home/home';
import { Medkit } from './features/medkit/medkit';
import { Login } from './features/auth/login/login';
import { Register } from './features/auth/register/register';
import { Account } from './features/account/account';
import { EditInfo } from './features/account/components/edit-info/edit-info';
import { EditProfile } from './features/account/components/edit-profile/edit-profile';
import { AddFamily } from './features/account/components/add-family/add-family';
import { AddLocation } from './features/home/components/add-location/add-location';
import { Meds } from './features/meds/meds';
import { AddMedicineForm } from './features/medkit/components/add-medicine-form/add-medicine-form';
import { AddTreatmentForm } from './features/meds/components/add-tratments-form/add-treatment-form';
import { authGuard } from './core/guards/auth.guard';
import { guestGuard } from './core/guards/guest.guard';
import { SuccessfulRegistration } from './features/auth/components/successfulRegistration/successfulRegistration';
import { AccountDeleted } from './features/auth/components/account-deleted/account-deleted';

export const routes: Routes = [
  {
    path: '',
    component: MainLayout,
    canActivate: [authGuard],
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
        path: 'account',
        children: [
          { path: '', component: Account },
          { path: 'edit', component: EditInfo },
          { path: 'profiles/:profileId/edit', component: EditProfile },
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
  { path: 'login', component: Login, canActivate: [guestGuard] },
  { path: 'register', component: Register, canActivate: [guestGuard] },
  { path: 'successful-registration', component: SuccessfulRegistration },
  { path: 'account-deleted', component: AccountDeleted },
];
