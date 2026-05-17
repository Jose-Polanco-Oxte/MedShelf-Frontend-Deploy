import { CommonModule } from '@angular/common';
import {
  Component,
  EventEmitter,
  Input,
  OnChanges,
  Output,
  SimpleChanges,
  inject,
  signal,
} from '@angular/core';
import { LucideAngularModule, X, AlertCircle } from 'lucide-angular';
import { ItemsService, type ItemResponse } from '../../../core/services/items.service';

@Component({
  selector: 'app-place-items-modal',
  imports: [CommonModule, LucideAngularModule],
  templateUrl: './place-items-modal.html',
  styleUrl: './place-items-modal.css',
})
export class PlaceItemsModal implements OnChanges {
  private itemsService = inject(ItemsService);

  @Input() open = false;
  @Input() placeId: string | null = null;
  @Input() placeName = '';
  @Output() closed = new EventEmitter<void>();

  items = signal<ItemResponse[]>([]);
  loading = signal(false);
  error = signal('');

  icons = { close: X, alertCircle: AlertCircle };

  ngOnChanges(changes: SimpleChanges) {
    if ((changes['open'] || changes['placeId']) && this.open && this.placeId) {
      this.loadItems();
    }

    if (!this.open) {
      this.items.set([]);
      this.error.set('');
      this.loading.set(false);
    }
  }

  close() {
    this.closed.emit();
  }

  private loadItems() {
    if (!this.placeId) return;

    this.loading.set(true);
    this.error.set('');

    this.itemsService.getItemsByPlace(this.placeId).subscribe({
      next: (response: any) => {
        this.items.set(response?.items ?? []);
        this.loading.set(false);
      },
      error: () => {
        this.items.set([]);
        this.error.set('No se pudieron cargar los items del lugar');
        this.loading.set(false);
      },
    });
  }
}
