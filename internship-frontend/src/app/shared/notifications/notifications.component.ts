import { Component, DestroyRef, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ApiService } from '../../core/services/api.service';
import { Notification } from '../../core/models/models';
import { IconDotComponent } from '../icon-dot/icon-dot.component';
import { poll } from '../../core/util/polling';
import { trackById } from '../../core/util/track-by';

@Component({
  selector: 'app-notifications',
  standalone: true,
  imports: [CommonModule, IconDotComponent],
  template: `
    <div class="page-header">
      <h2>Notifications</h2>
    </div>

    <div *ngIf="loading" class="card text-muted">Chargement des notifications...</div>

    <div *ngIf="!loading" class="grid" style="grid-template-columns: 420px 1fr; gap: 20px; align-items: start;">
      <div>
        <div *ngFor="let n of notifications; trackBy: trackById" class="list-row" [class.selected]="selected?.id === n.id" (click)="select(n)">
          <app-icon-dot [size]="28"></app-icon-dot>
          <div style="flex: 1; min-width: 0;">
            <div class="list-row-title" [style.opacity]="n.read ? 0.55 : 1">{{ n.title }}</div>
            <div class="list-row-sub" style="font-style: normal;">{{ n.createdAt | date: 'short' }}</div>
          </div>
          <span *ngIf="!n.read" class="badge badge-danger">nouveau</span>
        </div>
        <div *ngIf="notifications.length === 0" class="card text-muted">Aucune notification pour le moment.</div>
      </div>

      <div class="card" *ngIf="selected">
        <div class="page-header">
          <h3 style="margin: 0;">{{ selected.title }}</h3>
          <span class="badge" [ngClass]="priorityClass(selected.priority)">{{ selected.priority }}</span>
        </div>
        <p>{{ selected.message }}</p>
        <p class="text-muted" style="font-size: 12px;">{{ selected.createdAt | date: 'medium' }}</p>

        <div style="display: flex; gap: 12px; margin-top: 16px;">
          <button *ngIf="!selected.read" class="btn btn-secondary" (click)="markRead(selected)">Marquer comme lue</button>
          <button class="btn btn-danger" (click)="remove(selected)">Supprimer</button>
        </div>
      </div>

      <div class="card text-muted" *ngIf="!selected">
        Sélectionnez une notification pour voir le détail.
      </div>
    </div>
  `
})
export class NotificationsComponent implements OnInit {
  notifications: Notification[] = [];
  selected: Notification | null = null;
  loading = true;
  readonly trackById = trackById;

  private destroyRef = inject(DestroyRef);

  constructor(private api: ApiService) {}

  ngOnInit(): void {
    // Poll every 5s so newly arrived notifications show up without a manual
    // refresh. `loading` only ever flips to false once, on the first response.
    poll(() => this.api.myNotifications(), this.destroyRef).subscribe((data) => {
      this.loading = false;
      this.notifications = data;
      if (this.selected) {
        this.selected = data.find((n) => n.id === this.selected!.id) ?? null;
      }
    });
  }

  select(n: Notification): void {
    this.selected = n;
  }

  markRead(n: Notification): void {
    this.api.markNotificationRead(n.id).subscribe(() => {
      n.read = true;
    });
  }

  remove(n: Notification): void {
    this.api.deleteNotification(n.id).subscribe(() => {
      this.notifications = this.notifications.filter((x) => x.id !== n.id);
      if (this.selected?.id === n.id) this.selected = null;
    });
  }

  priorityClass(p: string): string {
    if (p === 'HIGH') return 'badge-danger';
    if (p === 'LOW') return 'badge-neutral';
    return 'badge-info';
  }
}
