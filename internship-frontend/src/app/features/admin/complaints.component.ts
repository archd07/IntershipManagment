import { Component, DestroyRef, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../core/services/api.service';
import { Complaint, ComplaintStatus } from '../../core/models/models';
import { label, COMPLAINT_STATUS_LABELS } from '../../core/data/labels';
import { poll } from '../../core/util/polling';
import { trackById } from '../../core/util/track-by';

@Component({
  selector: 'app-admin-complaints',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="page-header">
      <h2>Réclamations</h2>
    </div>

    <div *ngIf="loading" class="card text-muted">Chargement des réclamations...</div>

    <div *ngIf="!loading" class="grid" style="grid-template-columns: 420px 1fr; gap: 20px; align-items: start;">
      <div>
        <div *ngFor="let c of complaints; trackBy: trackById" class="list-row" [class.selected]="selected?.id === c.id" (click)="select(c)">
          <div class="list-row-avatar"></div>
          <div style="flex: 1; min-width: 0;">
            <div class="list-row-title">{{ c.student?.firstName }} {{ c.student?.lastName }}</div>
            <div class="list-row-sub">{{ c.subject }}</div>
          </div>
          <span class="badge" [ngClass]="statusClass(c.status)">{{ statusLabel(c.status) }}</span>
        </div>
        <div *ngIf="complaints.length === 0" class="card text-muted">Aucune réclamation pour le moment.</div>
      </div>

      <div class="card" *ngIf="selected">
        <div class="page-header">
          <h3 style="margin: 0;">{{ selected.subject }}</h3>
          <span class="badge" [ngClass]="statusClass(selected.status)">{{ statusLabel(selected.status) }}</span>
        </div>
        <div class="grid grid-2" style="margin-bottom: 16px;">
          <div><div class="kpi-label">Étudiant</div><div>{{ selected.student?.firstName }} {{ selected.student?.lastName }}</div></div>
          <div><div class="kpi-label">Soumise le</div><div>{{ selected.createdAt | date: 'medium' }}</div></div>
        </div>
        <p>{{ selected.description || 'Aucune description fournie.' }}</p>

        <div class="form-group" style="max-width: 260px; margin-top: 16px;">
          <label>Changer le statut</label>
          <select [ngModel]="selected.status" (ngModelChange)="updateStatus(selected, $event)">
            <option value="SUBMITTED">Soumise</option>
            <option value="UNDER_REVIEW">En cours d'examen</option>
            <option value="RESOLVED">Résolue</option>
            <option value="CLOSED">Clôturée</option>
          </select>
        </div>
      </div>

      <div class="card text-muted" *ngIf="!selected">
        Sélectionnez une réclamation pour voir le détail.
      </div>
    </div>
  `
})
export class AdminComplaintsComponent implements OnInit {
  complaints: Complaint[] = [];
  selected: Complaint | null = null;
  loading = true;
  readonly trackById = trackById;

  private destroyRef = inject(DestroyRef);

  constructor(private api: ApiService) {}

  ngOnInit(): void {
    // Poll every 6s so newly submitted complaints appear without a manual
    // refresh. `loading` only ever flips to false once, on the first response.
    poll(() => this.api.allComplaints(), this.destroyRef, 6000).subscribe((data) => {
      this.complaints = data;
      this.loading = false;
      if (this.selected) {
        this.selected = data.find((c) => c.id === this.selected!.id) ?? this.selected;
      }
    });
  }

  select(c: Complaint): void {
    this.selected = c;
  }

  updateStatus(c: Complaint, status: ComplaintStatus): void {
    this.api.updateComplaintStatus(c.id, status).subscribe((updated) => {
      c.status = updated.status;
    });
  }

  statusLabel(status: string): string {
    return label(COMPLAINT_STATUS_LABELS, status);
  }

  statusClass(status: string): string {
    if (status === 'RESOLVED' || status === 'CLOSED') return 'badge-success';
    if (status === 'UNDER_REVIEW') return 'badge-warning';
    return 'badge-neutral';
  }
}
