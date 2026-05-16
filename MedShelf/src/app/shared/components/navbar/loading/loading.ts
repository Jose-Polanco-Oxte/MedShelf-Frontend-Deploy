import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-loading',
  imports: [],
  templateUrl: './loading.html',
  styleUrl: './loading.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Loading {}
