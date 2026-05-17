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
import { FormsModule } from '@angular/forms';
import { LucideAngularModule, X, AlertCircle, Search, Pill, Clock3 } from 'lucide-angular';
import { ItemsService, type ItemResponse } from '../../../core/services/items.service';

@Component({
  selector: 'app-place-items-modal',
  imports: [CommonModule, FormsModule, LucideAngularModule],
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
  searchTerm = signal('');

  icons = { close: X, alertCircle: AlertCircle, search: Search, pill: Pill, clock: Clock3 };

  ngOnChanges(changes: SimpleChanges) {
    if ((changes['open'] || changes['placeId']) && this.open && this.placeId) {
      this.searchTerm.set('');
      this.loadItems();
    }

    if (!this.open) {
      this.items.set([]);
      this.error.set('');
      this.loading.set(false);
      this.searchTerm.set('');
    }
  }

  close() {
    this.closed.emit();
  }

  onSearchChange(value: string) {
    this.searchTerm.set(value);
    this.loadItems(value);
  }

  clearSearch() {
    this.searchTerm.set('');
    this.loadItems('');
  }

  formatDate(value?: string) {
    if (!value) return 'Por definir';

    const normalized = value.includes('T') ? value : `${value}T00:00:00Z`;
    const date = new Date(normalized);

    if (Number.isNaN(date.getTime())) return 'Por definir';

    return new Intl.DateTimeFormat('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      timeZone: 'UTC',
    }).format(date);
  }

  private loadItems(search = '') {
    if (!this.placeId) return;

    this.loading.set(true);
    this.error.set('');

    const params = search.trim() ? { 'filter[name]': search.trim() } : undefined;

    this.itemsService.getItemsByPlace(this.placeId, params).subscribe({
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
