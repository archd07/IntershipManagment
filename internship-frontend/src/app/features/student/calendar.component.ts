import { Component, DestroyRef, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../core/services/api.service';
import { Attendance, InternshipRequest } from '../../core/models/models';
import { trackById } from '../../core/util/track-by';
import { poll } from '../../core/util/polling';

@Component({
  selector: 'app-calendar',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="page-header">
      <h2>Calendrier de présence</h2>
    </div>

    <div *ngIf="loading" class="card text-muted">Chargement...</div>

    <div *ngIf="!loading && !activeRequest" class="card">
      <p class="text-muted">Vous n'avez pas encore de stage actif.</p>
    </div>

    <div *ngIf="!loading && activeRequest">
      <div class="grid grid-3" style="margin-bottom: 20px;">
        <div class="card">
          <div class="kpi-value">{{ present }}</div>
          <div class="kpi-label">Jours présents</div>
        </div>
        <div class="card">
          <div class="kpi-value">{{ absent }}</div>
          <div class="kpi-label">Jours absents</div>
        </div>
        <!--
        <div class="card">
          <div class="kpi-value">{{ attendanceRate }}%</div>
          <div class="kpi-label">Taux de présence</div>
        </div>
        -->
      </div>

      <div class="card">
        <h3>Enregistrer la présence du jour</h3>
        <div class="grid grid-3">
          <div class="form-group">
            <label>Date</label>
            <input type="date" [(ngModel)]="form.date">
          </div>
          <div class="form-group">
            <label>Statut</label>
            <select [(ngModel)]="form.status">
              <option value="PRESENT">Présent</option>
              <option value="ABSENT">Absent</option>
            </select>
          </div>
          <div class="form-group" style="display: flex; align-items: flex-end;">
            <button class="btn btn-primary" (click)="record()" [disabled]="recording">
              {{ recording ? 'Enregistrement...' : 'Enregistrer' }}
            </button>
          </div>
        </div>
        <div *ngIf="recordError" class="badge badge-danger">{{ recordError }}</div>
      </div>

      <div class="card" style="margin-top: 20px; padding: 0;">
        <table>
          <thead>
            <tr><th>Date</th><th>Statut</th></tr>
          </thead>
          <tbody>
            <tr *ngFor="let a of records; trackBy: trackById">
              <td>{{ a.date }}</td>
              <td><span class="badge" [ngClass]="a.status === 'PRESENT' ? 'badge-success' : 'badge-danger'">{{ a.status === 'PRESENT' ? 'Présent' : 'Absent' }}</span></td>
            </tr>
            <tr *ngIf="records.length === 0"><td colspan="2" class="text-muted">Aucune présence enregistrée pour le moment.</td></tr>
          </tbody>
        </table>
      </div>
    </div>
  `
})
export class CalendarComponent implements OnInit {
  records: Attendance[] = [];
  activeRequest: InternshipRequest | null = null;
  form = { date: new Date().toISOString().substring(0, 10), status: 'PRESENT' as 'PRESENT' | 'ABSENT' };
  loading = true;
  recording = false;
  recordError = '';
  readonly trackById = trackById;

  constructor(private api: ApiService) {}

  private destroyRef = inject(DestroyRef);

  get present(): number { return this.records.filter((r) => r.status === 'PRESENT').length; }
  get absent(): number { return this.records.filter((r) => r.status === 'ABSENT').length; }
  get attendanceRate(): number {
    const total = this.records.length;
    return total === 0 ? 0 : Math.round((this.present / total) * 100);
  }

  ngOnInit(): void {
    this.api.myRequests().subscribe((reqs) => {
      this.activeRequest = reqs.find((r) => ['ASSIGNED', 'IN_PROGRESS'].includes(r.status)) || null;
    });

    // Poll every 6s so attendance stays current without a manual refresh.
    // `loading` only ever flips to false once, on the first response.
    poll(() => this.api.myAttendance(), this.destroyRef, 6000).subscribe({
      next: (data) => { this.loading = false; this.records = data; },
      error: () => (this.loading = false)
    });
  }

  loadAttendance(): void {
    this.api.myAttendance().subscribe((data) => (this.records = data));
  }

  record(): void {
    if (!this.activeRequest) return;
    this.recording = true;
    this.recordError = '';
    this.api.recordAttendance(this.activeRequest.id, this.form).subscribe({
      next: () => {
        this.recording = false;
        this.loadAttendance();
      },
      error: (err) => {
        this.recording = false;
        this.recordError = err.error?.message || 'Impossible d\'enregistrer la présence.';
      }
    });
  }
}
