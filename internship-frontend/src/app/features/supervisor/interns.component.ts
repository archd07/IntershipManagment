import { Component, DestroyRef, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../core/services/api.service';
import { Attendance, Evaluation, InternshipRequest } from '../../core/models/models';
import { label, REQUEST_STATUS_LABELS } from '../../core/data/labels';
import { poll } from '../../core/util/polling';
import { trackById } from '../../core/util/track-by';

@Component({
  selector: 'app-supervisor-interns',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="page-header">
      <h2>Mes stagiaires</h2>
    </div>

    <div *ngIf="loading" class="card text-muted">Chargement de vos stagiaires...</div>

    <div *ngIf="!loading" class="grid" style="grid-template-columns: 340px 1fr; gap: 20px; align-items: start;">
      <div>
        <div *ngFor="let i of interns; trackBy: trackById" class="list-row" [class.selected]="selected?.id === i.id" (click)="select(i)">
          <div class="list-row-avatar"></div>
          <div>
            <div class="list-row-title">{{ i.student?.firstName }} {{ i.student?.lastName }}</div>
            <div class="list-row-sub">{{ i.specialty || '—' }}</div>
          </div>
          <span class="badge badge-info" style="margin-left: auto;">{{ statusLabel(i.status) }}</span>
        </div>
        <div *ngIf="interns.length === 0" class="card text-muted">Aucun stagiaire affecté pour le moment.</div>
      </div>

      <div *ngIf="selected" class="card">
        <div class="page-header">
          <h3 style="margin: 0;">{{ selected.student?.firstName }} {{ selected.student?.lastName }}</h3>
          <button class="btn btn-secondary" (click)="markCompleted()" *ngIf="selected.status !== 'COMPLETED'">
            Marquer le stage comme terminé
          </button>
        </div>

        <div class="grid grid-3" style="margin-bottom: 20px;">
          <div><div class="kpi-label">Spécialité</div><div>{{ selected.specialty || '—' }}</div></div>
          <div><div class="kpi-label">Durée</div><div>{{ selected.durationInWeeks }} semaines</div></div>
          <div><div class="kpi-label">Entité</div><div>{{ selected.entity || '—' }}</div></div>
        </div>

        <h4>Présence</h4>
        <table style="margin-bottom: 20px;">
          <thead><tr><th>Date</th><th>Statut</th></tr></thead>
          <tbody>
            <tr *ngFor="let a of attendance; trackBy: trackById"><td>{{ a.date }}</td>
              <td><span class="badge" [ngClass]="a.status === 'PRESENT' ? 'badge-success' : 'badge-danger'">{{ a.status === 'PRESENT' ? 'Présent' : 'Absent' }}</span></td>
            </tr>
            <tr *ngIf="attendance.length === 0"><td colspan="2" class="text-muted">Aucune présence enregistrée.</td></tr>
          </tbody>
        </table>

        <div class="page-header" style="margin-bottom: 8px;">
          <h4 style="margin: 0;">Évaluation</h4>
          <span *ngIf="evaluationConfirmed" class="badge badge-success">Confirmée — verrouillée</span>
        </div>

        <div *ngIf="evaluationConfirmed" class="card text-muted" style="margin-bottom: 16px;">
          Cette évaluation a été confirmée et ne peut plus être modifiée.
        </div>

        <fieldset [disabled]="evaluationConfirmed" style="border: none; padding: 0; margin: 0;">
          <div class="grid grid-3">
            <div class="form-group">
              <label>Résultat global</label>
              <select [(ngModel)]="evalForm.overallResult">
                <option value="VERY_SATISFACTORY">Très satisfaisant</option>
                <option value="SATISFACTORY">Satisfaisant</option>
                <option value="UNSATISFACTORY">Insatisfaisant</option>
              </select>
            </div>
            <div class="form-group">
              <label>Performance technique (0-20)</label>
              <input type="number" [(ngModel)]="evalForm.technicalPerformance">
            </div>
            <div class="form-group">
              <label>Comportement professionnel (0-20)</label>
              <input type="number" [(ngModel)]="evalForm.professionalBehavior">
            </div>
            <div class="form-group">
              <label>Qualité du travail (0-20)</label>
              <input type="number" [(ngModel)]="evalForm.qualityOfWork">
            </div>
            <div class="form-group">
              <label>Autonomie (0-20)</label>
              <input type="number" [(ngModel)]="evalForm.autonomy">
            </div>
            <div class="form-group">
              <label>Communication (0-20)</label>
              <input type="number" [(ngModel)]="evalForm.communication">
            </div>
          </div>
          <div class="form-group">
            <label>Commentaires finaux</label>
            <textarea rows="3" [(ngModel)]="evalForm.finalComments"></textarea>
          </div>
        </fieldset>

        <div *ngIf="evalError" class="badge badge-danger" style="margin-bottom: 12px;">{{ evalError }}</div>

        <div *ngIf="!evaluationConfirmed" style="display: flex; gap: 12px; align-items: center;">
          <button class="btn btn-secondary" (click)="saveEvaluation()">Enregistrer (brouillon)</button>
          <button class="btn btn-primary" (click)="confirmEvaluation()">Confirmer l'évaluation</button>
          <span *ngIf="evalMessage" class="badge badge-success">{{ evalMessage }}</span>
        </div>
        <p class="text-muted" style="font-size: 12px; margin-top: 8px;" *ngIf="!evaluationConfirmed">
          Une fois confirmée, l'évaluation ne pourra plus être modifiée.
        </p>
      </div>

      <div *ngIf="!selected" class="card text-muted">
        Sélectionnez un stagiaire pour voir les détails et soumettre une évaluation.
      </div>
    </div>
  `
})
export class SupervisorInternsComponent implements OnInit {
  interns: InternshipRequest[] = [];
  selected: InternshipRequest | null = null;
  attendance: Attendance[] = [];
  evalMessage = '';
  evalError = '';
  evaluationConfirmed = false;
  loading = true;
  readonly trackById = trackById;

  evalForm: any = {
    overallResult: 'SATISFACTORY', technicalPerformance: null, professionalBehavior: null,
    attendanceScore: null, qualityOfWork: null, autonomy: null, communication: null, finalComments: ''
  };

  constructor(private api: ApiService) {}

  private destroyRef = inject(DestroyRef);

  ngOnInit(): void {
    // Poll every 6s so newly assigned interns appear without a manual
    // refresh. `loading` only ever flips to false once, on the first response.
    poll(() => this.api.myInterns(), this.destroyRef, 6000).subscribe((data) => {
      this.loading = false;
      this.interns = data;
      if (this.selected) {
        this.selected = data.find((i) => i.id === this.selected!.id) ?? this.selected;
      }
    });
  }

  select(i: InternshipRequest): void {
    this.selected = i;
    this.evalMessage = '';
    this.evalError = '';
    this.evaluationConfirmed = false;
    this.evalForm = {
      overallResult: 'SATISFACTORY', technicalPerformance: null, professionalBehavior: null,
      attendanceScore: null, qualityOfWork: null, autonomy: null, communication: null, finalComments: ''
    };

    // A supervisor's assigned interns always have an account by this point
    // (created automatically no later than acceptance).
    if (i.student) {
      this.api.internAttendance(i.student.id).subscribe((a) => (this.attendance = a));
    }

    // Load any existing evaluation (draft or confirmed) so the supervisor
    // sees what was already entered instead of a blank form every time.
    this.api.getEvaluation(i.id).subscribe({
      next: (evaluation) => this.applyEvaluation(evaluation),
      error: () => {} // no evaluation yet — keep the blank defaults
    });
  }

  private applyEvaluation(evaluation: Evaluation): void {
    this.evaluationConfirmed = evaluation.confirmed;
    this.evalForm = {
      overallResult: evaluation.overallResult ?? 'SATISFACTORY',
      technicalPerformance: evaluation.technicalPerformance ?? null,
      professionalBehavior: evaluation.professionalBehavior ?? null,
      attendanceScore: evaluation.attendanceScore ?? null,
      qualityOfWork: evaluation.qualityOfWork ?? null,
      autonomy: evaluation.autonomy ?? null,
      communication: evaluation.communication ?? null,
      finalComments: evaluation.finalComments ?? ''
    };
  }

  markCompleted(): void {
    if (!this.selected) return;
    this.api.completeInternship(this.selected.id).subscribe((res) => (this.selected = res));
  }

  saveEvaluation(): void {
    if (!this.selected) return;
    this.evalError = '';
    this.api.submitEvaluation(this.selected.id, this.evalForm).subscribe({
      next: () => (this.evalMessage = 'Évaluation enregistrée.'),
      error: (err) => (this.evalError = err.error?.message || 'Impossible d\'enregistrer l\'évaluation.')
    });
  }

  confirmEvaluation(): void {
    if (!this.selected) return;
    this.evalError = '';
    // Save the latest edits first, then lock.
    this.api.submitEvaluation(this.selected.id, this.evalForm).subscribe({
      next: () => {
        this.api.confirmEvaluation(this.selected!.id).subscribe({
          next: (evaluation) => {
            this.applyEvaluation(evaluation);
            this.evalMessage = 'Évaluation confirmée.';
          },
          error: (err) => (this.evalError = err.error?.message || 'Impossible de confirmer l\'évaluation.')
        });
      },
      error: (err) => (this.evalError = err.error?.message || 'Impossible d\'enregistrer l\'évaluation.')
    });
  }

  statusLabel(status: string): string {
    return label(REQUEST_STATUS_LABELS, status);
  }
}
