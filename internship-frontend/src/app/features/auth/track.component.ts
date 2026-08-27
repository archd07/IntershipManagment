import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ApiService } from '../../core/services/api.service';
import { PublicStatus } from '../../core/models/models';
import { label, REQUEST_STATUS_LABELS } from '../../core/data/labels';

@Component({
  selector: 'app-track',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="auth-page">
      <div class="auth-card card">
        <h2>Suivre ma demande</h2>
        <p class="text-muted">Entrez l'email utilisé lors de votre candidature pour voir son statut.</p>

        <div class="form-group">
          <label>Email</label>
          <input type="email" [(ngModel)]="email" placeholder="vous@exemple.com">
        </div>

        <button class="btn btn-primary" style="width: 100%; justify-content: center;" (click)="search()" [disabled]="loading">
          {{ loading ? 'Recherche...' : 'Rechercher' }}
        </button>

        <div *ngIf="searched && results.length === 0" class="text-muted" style="margin-top: 16px;">
          Aucune demande trouvée pour cet email.
        </div>

        <div *ngFor="let r of results" class="card" style="margin-top: 16px;">
          <div class="page-header" style="margin-bottom: 8px;">
            <h4 style="margin: 0;">{{ r.internshipType || 'Stage' }}</h4>
            <span class="badge" [ngClass]="statusClass(r.status)">{{ statusLabel(r.status) }}</span>
          </div>
          <p class="text-muted" style="font-size: 12px;">Soumise le {{ r.submittedAt | date: 'medium' }}</p>
          <p *ngIf="r.status === 'REJECTED' && r.rejectionReason">Motif : {{ r.rejectionReason }}</p>
          <p *ngIf="r.status === 'ACCEPTED' || r.status === 'ASSIGNED'" class="text-muted">
            Votre compte a été créé — connectez-vous avec le mot de passe temporaire fourni par l'administration.
          </p>
        </div>

        <p class="text-muted" style="margin-top: 16px; text-align: center;">
          <a routerLink="/login">Se connecter</a> &middot; <a routerLink="/apply">Nouvelle demande</a>
        </p>
      </div>
    </div>
  `,
  styles: [`
    .auth-page { min-height: 100vh; display: flex; align-items: center; justify-content: center; background: var(--color-panel); padding: 40px 0; }
    .auth-card { width: 460px; }
  `]
})
export class TrackComponent {
  email = '';
  results: PublicStatus[] = [];
  loading = false;
  searched = false;

  constructor(private api: ApiService) {}

  search(): void {
    if (!this.email.trim()) return;
    this.loading = true;
    this.api.publicTrackStatus(this.email).subscribe({
      next: (data) => {
        this.loading = false;
        this.searched = true;
        this.results = data;
      },
      error: () => {
        this.loading = false;
        this.searched = true;
        this.results = [];
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
