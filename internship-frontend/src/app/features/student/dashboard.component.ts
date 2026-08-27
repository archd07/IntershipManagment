import { Component, DestroyRef, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ApiService } from '../../core/services/api.service';
import { InternshipRequest } from '../../core/models/models';
import { AuthService } from '../../core/services/auth.service';
import { label, REQUEST_STATUS_LABELS } from '../../core/data/labels';
import { poll } from '../../core/util/polling';

@Component({
  selector: 'app-student-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="page-header">
      <div>
        <h2>Bienvenue, {{ auth.currentUser()?.fullName }}</h2>
        <p class="text-muted">Voici où en est votre stage aujourd'hui.</p>
      </div>
    </div>

    <div *ngIf="loading" class="card text-muted">Chargement...</div>

    <div *ngIf="!loading && latest as r" class="card" style="margin-bottom: 20px;">
      <div class="page-header" style="margin-bottom: 12px;">
        <h3 style="margin: 0;">Candidature en cours</h3>
        <span class="badge" [ngClass]="statusClass(r.status)">{{ statusLabel(r.status) }}</span>
      </div>

      <div class="grid grid-3">
        <div>
          <div class="kpi-label">Type de stage</div>
          <div>{{ r.internshipType || '—' }}</div>
        </div>
        <div>
          <div class="kpi-label">Durée</div>
          <div>{{ r.durationInWeeks }} semaines</div>
        </div>
        <div>
          <div class="kpi-label">Encadrant</div>
          <div>{{ r.supervisor?.firstName ? (r.supervisor?.firstName + ' ' + r.supervisor?.lastName) : 'Pas encore affecté' }}</div>
        </div>
      </div>

      <div *ngIf="r.status === 'COMPLETED'" style="margin-top: 16px;">
        <div class="badge badge-success" style="font-size: 14px; padding: 8px 16px;">Stage terminé</div>
      </div>

      <div *ngIf="r.status !== 'COMPLETED' && daysRemaining !== null" style="margin-top: 16px;">
        <div class="kpi-value">{{ daysRemaining }} jours restants</div>
        <div class="kpi-label">avant la fin du stage</div>
      </div>

      <div *ngIf="r.status === 'REJECTED' && r.rejectionReason" class="badge badge-danger" style="margin-top: 12px;">
        Motif : {{ r.rejectionReason }}
      </div>

      <a routerLink="/student/application" class="btn btn-secondary" style="margin-top: 16px;">Voir / modifier la candidature</a>
    </div>

    <div *ngIf="!loading && !latest" class="card">
      <h3>Aucune candidature pour le moment</h3>
      <p class="text-muted">Commencez votre parcours de stage en soumettant votre candidature.</p>
      <a routerLink="/student/application" class="btn btn-primary">Commencer la candidature</a>
    </div>
  `
})
export class StudentDashboardComponent implements OnInit {
  requests: InternshipRequest[] = [];
  latest: InternshipRequest | null = null;
  daysRemaining: number | null = null;
  loading = true;

  constructor(private api: ApiService, public auth: AuthService) {}

  private destroyRef = inject(DestroyRef);

  ngOnInit(): void {
    // Poll every 6s so acceptance/rejection/assignment show up without a
    // manual refresh. `loading` only ever flips to false once, on the first
    // response — avoids briefly showing "no application yet" before the real
    // data arrives.
    poll(() => this.api.myRequests(), this.destroyRef, 6000).subscribe((data) => {
      this.loading = false;
      this.requests = data;
      this.latest = data.length ? data[data.length - 1] : null;
      if (this.latest?.endDate) {
        const end = new Date(this.latest.endDate).getTime();
        const now = Date.now();
        this.daysRemaining = Math.max(0, Math.ceil((end - now) / (1000 * 60 * 60 * 24)));
      } else {
        this.daysRemaining = null;
      }
    });
  }

  statusLabel(status: string): string {
    return label(REQUEST_STATUS_LABELS, status);
  }

  statusClass(status: string): string {
    if (['ACCEPTED', 'ASSIGNED', 'IN_PROGRESS', 'COMPLETED'].includes(status)) return 'badge-success';
    if (['SUBMITTED', 'PENDING', 'DRAFT'].includes(status)) return 'badge-warning';
    if (['REJECTED', 'CANCELLED'].includes(status)) return 'badge-danger';
    return 'badge-neutral';
  }
}
