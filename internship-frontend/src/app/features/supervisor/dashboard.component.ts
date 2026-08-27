import { Component, DestroyRef, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ApiService } from '../../core/services/api.service';
import { InternshipRequest, SupervisorProfile } from '../../core/models/models';
import { AuthService } from '../../core/services/auth.service';
import { label, REQUEST_STATUS_LABELS } from '../../core/data/labels';
import { poll } from '../../core/util/polling';
import { trackById } from '../../core/util/track-by';

@Component({
  selector: 'app-supervisor-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="page-header">
      <div>
        <h2>Bienvenue, {{ auth.currentUser()?.fullName }}</h2>
        <p class="text-muted">{{ profile?.entity }}</p>
      </div>
    </div>

    <div class="grid grid-3" style="margin-bottom: 24px;">
      <div class="card">
        <div class="kpi-value">{{ interns.length }}</div>
        <div class="kpi-label">Stagiaires affectés</div>
      </div>
      <div class="card">
        <div class="kpi-value">{{ profile?.currentInterns ?? 0 }} / {{ profile?.maxInterns ?? 0 }}</div>
        <div class="kpi-label">Capacité utilisée</div>
      </div>
      <div class="card">
        <div class="kpi-value">{{ inProgressCount }}</div>
        <div class="kpi-label">Stages en cours</div>
      </div>
    </div>

    <div *ngIf="loading" class="card text-muted">Chargement...</div>

    <div *ngIf="!loading" class="card" style="padding: 0;">
      <div class="page-header" style="padding: 20px 20px 0;">
        <h3 style="margin: 0;">Mes stagiaires</h3>
        <a routerLink="/supervisor/interns" class="btn btn-secondary">Voir tout</a>
      </div>
      <table>
        <thead><tr><th>Étudiant</th><th>Spécialité</th><th>Statut</th><th>Fin</th></tr></thead>
        <tbody>
          <tr *ngFor="let i of interns.slice(0, 6); trackBy: trackById">
            <td>{{ i.student?.firstName }} {{ i.student?.lastName }}</td>
            <td>{{ i.specialty || '—' }}</td>
            <td><span class="badge badge-info">{{ statusLabel(i.status) }}</span></td>
            <td>{{ i.endDate || '—' }}</td>
          </tr>
          <tr *ngIf="interns.length === 0"><td colspan="4" class="text-muted">Aucun stagiaire affecté pour le moment.</td></tr>
        </tbody>
      </table>
    </div>
  `
})
export class SupervisorDashboardComponent implements OnInit {
  interns: InternshipRequest[] = [];
  profile: SupervisorProfile | null = null;
  loading = true;
  readonly trackById = trackById;

  constructor(private api: ApiService, public auth: AuthService) {}

  private destroyRef = inject(DestroyRef);

  get inProgressCount(): number {
    return this.interns.filter((i) => ['ASSIGNED', 'IN_PROGRESS'].includes(i.status)).length;
  }

  ngOnInit(): void {
    // Poll every 6s so newly assigned interns appear without a manual
    // refresh. `loading` only ever flips to false once, on the first response.
    poll(() => this.api.myInterns(), this.destroyRef, 6000).subscribe((data) => {
      this.loading = false;
      this.interns = data;
    });
    this.api.myProfile().subscribe((p) => (this.profile = p));
  }

  statusLabel(status: string): string {
    return label(REQUEST_STATUS_LABELS, status);
  }
}
