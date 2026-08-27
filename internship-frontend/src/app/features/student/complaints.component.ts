import { Component, DestroyRef, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../core/services/api.service';
import { Complaint } from '../../core/models/models';
import { label, COMPLAINT_STATUS_LABELS } from '../../core/data/labels';
import { poll } from '../../core/util/polling';
import { trackById } from '../../core/util/track-by';

@Component({
  selector: 'app-student-complaints',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="page-header">
      <h2>Réclamations</h2>
    </div>

    <div class="card" style="margin-bottom: 20px;">
      <h3>Soumettre une réclamation</h3>
      <div class="form-group">
        <label>Sujet</label>
        <input [(ngModel)]="form.subject" placeholder="ex. Problème de présence">
      </div>
      <div class="form-group">
        <label>Description</label>
        <textarea rows="3" [(ngModel)]="form.description"></textarea>
      </div>
      <button class="btn btn-primary" (click)="submit()">Soumettre la réclamation</button>
    </div>

    <div class="grid" style="grid-template-columns: 420px 1fr; gap: 20px; align-items: start;">
      <div>
        <div *ngFor="let c of complaints; trackBy: trackById" class="list-row" [class.selected]="selected?.id === c.id" (click)="select(c)">
          <div style="flex: 1; min-width: 0;">
            <div class="list-row-title">{{ c.subject }}</div>
            <div class="list-row-sub" style="font-style: normal;">{{ c.createdAt | date: 'mediumDate' }}</div>
          </div>
          <span class="badge" [ngClass]="statusClass(c.status)">{{ statusLabel(c.status) }}</span>
        </div>
        <div *ngIf="complaints.length === 0" class="card text-muted">Aucune réclamation soumise.</div>
      </div>

      <div class="card" *ngIf="selected">
        <div class="page-header">
          <h3 style="margin: 0;">{{ selected.subject }}</h3>
          <span class="badge" [ngClass]="statusClass(selected.status)">{{ statusLabel(selected.status) }}</span>
        </div>
        <p class="text-muted" style="font-size: 12px;">Soumise le {{ selected.createdAt | date: 'medium' }}</p>
        <p>{{ selected.description || 'Aucune description fournie.' }}</p>
      </div>

      <div class="card text-muted" *ngIf="!selected">
        Sélectionnez une réclamation pour voir le détail.
      </div>
    </div>
  `
})
export class StudentComplaintsComponent implements OnInit {
  complaints: Complaint[] = [];
  selected: Complaint | null = null;
  form = { subject: '', description: '' };
  readonly trackById = trackById;

  private destroyRef = inject(DestroyRef);

  constructor(private api: ApiService) {}

  ngOnInit(): void {
    // Poll every 6s so status changes made by the admin appear without a manual refresh.
    poll(() => this.api.myComplaints(), this.destroyRef, 6000).subscribe((data) => {
      this.complaints = data;
      if (this.selected) {
        this.selected = data.find((c) => c.id === this.selected!.id) ?? this.selected;
      }
    });
  }

  select(c: Complaint): void {
    this.selected = c;
  }

  submit(): void {
    if (!this.form.subject.trim()) return;
    this.api.submitComplaint(this.form).subscribe((created) => {
      this.form = { subject: '', description: '' };
      this.complaints = [created, ...this.complaints];
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
