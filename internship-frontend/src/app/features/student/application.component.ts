import { Component, DestroyRef, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../core/services/api.service';
import { InternshipRequest } from '../../core/models/models';
import { label, REQUEST_STATUS_LABELS } from '../../core/data/labels';
import { INTERNSHIP_TYPES } from '../../core/data/morocco-academic-data';
import { poll } from '../../core/util/polling';

@Component({
  selector: 'app-application',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="page-header">
      <h2>Ma candidature</h2>
    </div>

    <div *ngIf="current && current.status !== 'DRAFT'" class="card" style="margin-bottom: 20px;">
      <div class="page-header" style="margin-bottom: 8px;">
        <h3 style="margin:0;">Statut</h3>
        <span class="badge" [ngClass]="statusClass(current.status)">{{ statusLabel(current.status) }}</span>
      </div>
      <p class="text-muted">
        Cette candidature a été soumise et ne peut plus être modifiée.
        <span *ngIf="current.status === 'REJECTED' && current.rejectionReason">Motif : {{ current.rejectionReason }}</span>
      </p>
      <div *ngIf="current.entity" style="margin-top: 12px;">
        <div class="kpi-label">Entité organisationnelle affectée</div>
        <div>{{ current.entity }}</div>
      </div>
    </div>

    <div class="card" *ngIf="!current || current.status === 'DRAFT'">
      <h3>{{ current ? 'Modifier le brouillon' : 'Nouvelle demande de stage' }}</h3>

      <div class="form-group">
        <label>Type de stage</label>
        <select [(ngModel)]="form.internshipType">
          <option value="">Sélectionner...</option>
          <option *ngFor="let t of internshipTypes" [value]="t">{{ t }}</option>
        </select>
      </div>

      <div class="grid grid-2">
        <div class="form-group">
          <label>Date de début</label>
          <input type="date" [(ngModel)]="form.startDate">
        </div>
        <div class="form-group">
          <label>Date de fin</label>
          <input type="date" [(ngModel)]="form.endDate">
        </div>
      </div>

      <div class="form-group" *ngIf="computedDuration !== null">
        <label>Durée (calculée automatiquement)</label>
        <input [value]="computedDuration + ' semaines'" disabled>
      </div>

      <div class="form-group">
        <label>Spécialité</label>
        <input [(ngModel)]="form.specialty">
      </div>

      <p class="text-muted" style="font-size: 12px; margin-bottom: 16px;">
        L'entité organisationnelle sera affectée par l'administration en fonction de l'encadrant assigné.
      </p>

      <div *ngIf="message" class="badge" [ngClass]="messageIsError ? 'badge-danger' : 'badge-success'" style="margin-bottom: 12px;">
        {{ message }}
      </div>

      <div style="display: flex; gap: 12px;">
        <button class="btn btn-secondary" (click)="saveDraft()" [disabled]="saving">Enregistrer comme brouillon</button>
        <button class="btn btn-primary" (click)="submit()" [disabled]="saving || !current">Soumettre la demande</button>
      </div>
      <p class="text-muted" style="margin-top: 8px; font-size: 12px;" *ngIf="!current">
        Enregistrez d'abord un brouillon, puis soumettez-le.
      </p>
    </div>
  `
})
export class ApplicationComponent implements OnInit {
  current: InternshipRequest | null = null;
  saving = false;
  message = '';
  messageIsError = false;
  internshipTypes = INTERNSHIP_TYPES;

  form: any = {
    internshipType: '', startDate: '', endDate: '', specialty: ''
  };

  constructor(private api: ApiService) {}

  private destroyRef = inject(DestroyRef);

  get computedDuration(): number | null {
    if (!this.form.startDate || !this.form.endDate) return null;
    const start = new Date(this.form.startDate).getTime();
    const end = new Date(this.form.endDate).getTime();
    if (end < start) return null;
    const days = Math.round((end - start) / (1000 * 60 * 60 * 24));
    return Math.ceil(days / 7);
  }

  ngOnInit(): void {
    this.load();

    // Poll every 6s, but only refresh the view once the request is no longer a
    // draft — otherwise this would overwrite the form while the student is typing.
    poll(() => this.api.myRequests(), this.destroyRef, 6000).subscribe((data) => {
      const active = data.find((r) => r.status !== 'DRAFT');
      if (active && (!this.current || this.current.status !== 'DRAFT')) {
        this.current = active;
      }
    });
  }

  load(): void {
    this.api.myRequests().subscribe((data) => {
      const draft = data.find((r) => r.status === 'DRAFT');
      const active = data.find((r) => r.status !== 'DRAFT');
      this.current = draft || active || null;
      if (this.current) {
        this.form = {
          internshipType: this.current.internshipType || '',
          startDate: this.current.startDate || '',
          endDate: this.current.endDate || '',
          specialty: this.current.specialty || ''
        };
      }
    });
  }

  saveDraft(): void {
    this.saving = true;
    this.message = '';
    const req$ = this.current
      ? this.api.updateDraft(this.current.id, this.form)
      : this.api.saveDraft(this.form);

    req$.subscribe({
      next: (res) => {
        this.saving = false;
        this.current = res;
        this.message = 'Brouillon enregistré.';
        this.messageIsError = false;
      },
      error: (err) => {
        this.saving = false;
        this.message = err.error?.message || 'Impossible d\'enregistrer le brouillon.';
        this.messageIsError = true;
      }
    });
  }

  submit(): void {
    if (!this.current) return;
    this.saving = true;
    this.api.submitRequest(this.current.id).subscribe({
      next: (res) => {
        this.saving = false;
        this.current = res;
        this.message = 'Votre demande a été soumise à l\'administration.';
        this.messageIsError = false;
      },
      error: (err) => {
        this.saving = false;
        this.message = err.error?.message || 'Impossible de soumettre la demande.';
        this.messageIsError = true;
      }
    });
  }

  statusLabel(status: string): string {
    return label(REQUEST_STATUS_LABELS, status);
  }

  statusClass(status: string): string {
    if (['ACCEPTED', 'ASSIGNED', 'IN_PROGRESS', 'COMPLETED'].includes(status)) return 'badge-success';
    if (['SUBMITTED', 'PENDING'].includes(status)) return 'badge-warning';
    if (['REJECTED', 'CANCELLED'].includes(status)) return 'badge-danger';
    return 'badge-neutral';
  }
}
