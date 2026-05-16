import { ChangeDetectionStrategy, Component } from '@angular/core';
import { Check, LucideAngularModule } from 'lucide-angular';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-successful-registration',
  imports: [LucideAngularModule, RouterLink],
  templateUrl: './successfulRegistration.html',
  styleUrl: './successfulRegistration.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SuccessfulRegistration {
  icons = {
    check: Check,
  };
}
