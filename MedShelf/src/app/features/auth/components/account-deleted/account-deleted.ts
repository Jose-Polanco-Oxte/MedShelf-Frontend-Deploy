import { ChangeDetectionStrategy, Component } from '@angular/core';
import { Heart, LucideAngularModule, HeartCrack } from 'lucide-angular';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-account-deleted',
  imports: [LucideAngularModule, RouterLink],
  templateUrl: './account-deleted.html',
  styleUrl: './account-deleted.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AccountDeleted {
  icons = {
    heart: Heart,
    brokenheart: HeartCrack,
  };
}
