import { Component, DestroyRef, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ApiService } from '../../core/services/api.service';
import { DashboardStats, InternshipRequest } from '../../core/models/models';
import { BarChartComponent, BarChartDatum } from '../../shared/charts/bar-chart.component';
import { DonutChartComponent, DonutChartDatum } from '../../shared/charts/donut-chart.component';
import { MonthlyChartDatum, MonthlyStatusCount, StackedMonthlyChartComponent } from '../../shared/charts/stacked-monthly-chart.component';
import { label, REQUEST_STATUS_LABELS } from '../../core/data/labels';
import { poll } from '../../core/util/polling';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, BarChartComponent, DonutChartComponent, StackedMonthlyChartComponent],
  template: `
    <div class="page-header">
      <h2>Tableau de bord</h2>
    </div>

    <div *ngIf="loadError" class="badge badge-danger" style="margin-bottom: 16px;">{{ loadError }}</div>

    <div *ngIf="loading" class="card text-muted">Chargement du tableau de bord...</div>

    <div class="grid grid-4" style="margin-bottom: 24px;" *ngIf="stats as s">
      <div class="card">
        <div class="kpi-value">{{ s.totalRequests }}</div>
        <div class="kpi-label">Demandes de stage</div>
      </div>
      <div class="card">
        <div class="kpi-value">{{ s.acceptedRequests }}</div>
        <div class="kpi-label">Acceptées</div>
      </div>
      <div class="card">
        <div class="kpi-value">{{ s.pendingRequests }}</div>
        <div class="kpi-label">En attente</div>
      </div>
      <div class="card">
        <div class="kpi-value">{{ s.rejectedRequests }}</div>
        <div class="kpi-label">Rejetées</div>
      </div>
    </div>

    <div class="grid grid-4" style="margin-bottom: 24px;" *ngIf="stats as s">
      <div class="card">
        <div class="kpi-value">{{ s.activeInterns }}</div>
        <div class="kpi-label">Stagiaires actifs</div>
      </div>
      <div class="card">
        <div class="kpi-value">{{ s.totalSupervisors }}</div>
        <div class="kpi-label">Encadrants</div>
      </div>
      <div class="card">
        <div class="kpi-value">{{ s.completedInternships }}</div>
        <div class="kpi-label">Stages terminés</div>
      </div>
      <div class="card">
        <div class="kpi-value">{{ s.unresolvedComplaints }}</div>
        <div class="kpi-label">Réclamations non résolues</div>
      </div>
    </div>

    <div class="grid grid-2">
      <div class="card">
        <h3>Demandes par statut</h3>
        <p class="text-muted" style="margin-bottom: 20px;">Vue d'ensemble de toutes les demandes du système.</p>
        <app-bar-chart [data]="barData"></app-bar-chart>
      </div>

      <div class="card">
        <h3>Répartition des résultats</h3>
        <p class="text-muted" style="margin-bottom: 20px;">Acceptées / en attente / rejetées, sur le total des demandes.</p>
        <app-donut-chart [data]="donutData"></app-donut-chart>
      </div>

      <div class="card" style="grid-column: 1 / -1;">
        <h3>Évolution mensuelle des demandes reçues</h3>
        <p class="text-muted" style="margin-bottom: 20px;">Chaque barre représente un mois et est divisée selon le statut des demandes.</p>
        <app-stacked-monthly-chart [data]="monthlyData" [legend]="monthlyLegend"></app-stacked-monthly-chart>
      </div>
    </div>
  `
})
export class AdminDashboardComponent implements OnInit {
  stats: DashboardStats | null = null;
  barData: BarChartDatum[] = [];
  donutData: DonutChartDatum[] = [];
  monthlyData: MonthlyChartDatum[] = [];
  monthlyLegend: MonthlyStatusCount[] = [];
  loadError = '';
  loading = true;

  constructor(private api: ApiService) {}

  private destroyRef = inject(DestroyRef);

  ngOnInit(): void {
    // Poll every 8s so KPIs and charts stay current without a manual refresh.
    poll(() => this.api.dashboardStats(), this.destroyRef, 8000).subscribe({
      next: (s) => {
        this.loading = false;
        this.stats = s;

        this.barData = [
          { label: 'Total', value: s.totalRequests },
          { label: 'Acceptées', value: s.acceptedRequests },
          { label: 'En attente', value: s.pendingRequests },
          { label: 'Rejetées', value: s.rejectedRequests },
          { label: 'Terminées', value: s.completedInternships },
        ];

        this.donutData = [
          { label: 'Acceptées', value: s.acceptedRequests, colorVar: '--color-success' },
          { label: 'En attente', value: s.pendingRequests, colorVar: '--color-warning' },
          { label: 'Rejetées', value: s.rejectedRequests, colorVar: '--color-danger' },
        ];
      },
      error: () => { this.loadError = 'Impossible de charger les statistiques.'; this.loading = false; }
    });

    poll(() => this.api.allRequests(), this.destroyRef, 8000).subscribe({
      next: (requests) => this.buildMonthlyData(requests),
      error: () => { this.loadError = 'Impossible de charger les statistiques.'; }
    });
  }

  private buildMonthlyData(requests: InternshipRequest[]): void {
    const statuses = Object.keys(REQUEST_STATUS_LABELS);
    const colors = ['#b9d65f', '#e0b84f', '#77a9cf', '#4c7a2e', '#8a2e2e', '#9b85c5', '#5c8f8f', '#d58b5b', '#777777'];
    this.monthlyLegend = statuses.map((status, index) => ({
      label: label(REQUEST_STATUS_LABELS, status),
      value: 0,
      color: colors[index % colors.length]
    }));

    const now = new Date();
    this.monthlyData = Array.from({ length: 12 }, (_, index) => {
      const date = new Date(now.getFullYear(), now.getMonth() - 11 + index, 1);
      const counts = statuses.map((status, statusIndex) => ({
        label: label(REQUEST_STATUS_LABELS, status),
        value: requests.filter((request) => {
          const createdAt = new Date(request.createdAt);
          return createdAt.getFullYear() === date.getFullYear()
            && createdAt.getMonth() === date.getMonth()
            && request.status === status;
        }).length,
        color: colors[statusIndex % colors.length]
      }));

      return {
        label: date.toLocaleDateString('fr-FR', { month: 'short' }).replace('.', ''),
        total: counts.reduce((sum, status) => sum + status.value, 0),
        statuses: counts
      };
    });
  }
}
