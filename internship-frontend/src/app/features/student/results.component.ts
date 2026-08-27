import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ApiService } from '../../core/services/api.service';
import { Certificate, Evaluation, InternshipRequest } from '../../core/models/models';
import { label, EVALUATION_RESULT_LABELS } from '../../core/data/labels';

@Component({
  selector: 'app-results',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="page-header">
      <h2>Résultats et attestation</h2>
    </div>

    <div *ngIf="!completedRequest" class="card">
      <p class="text-muted">Vos résultats apparaîtront ici une fois votre stage terminé et évalué.</p>
    </div>

    <div *ngIf="completedRequest">
      <div class="card" style="margin-bottom: 20px;" *ngIf="evaluation">
        <div class="page-header" style="margin-bottom: 12px;">
          <h3 style="margin:0;">Évaluation</h3>
          <span class="badge" [ngClass]="resultClass(evaluation.overallResult)">{{ resultLabel(evaluation.overallResult) }}</span>
        </div>
        <div class="grid grid-3">
          <div><div class="kpi-label">Performance technique</div><div>{{ evaluation.technicalPerformance ?? '—' }}</div></div>
          <div><div class="kpi-label">Comportement professionnel</div><div>{{ evaluation.professionalBehavior ?? '—' }}</div></div>
          <div><div class="kpi-label">Assiduité</div><div>{{ evaluation.attendanceScore ?? '—' }}</div></div>
          <div><div class="kpi-label">Qualité du travail</div><div>{{ evaluation.qualityOfWork ?? '—' }}</div></div>
          <div><div class="kpi-label">Autonomie</div><div>{{ evaluation.autonomy ?? '—' }}</div></div>
          <div><div class="kpi-label">Communication</div><div>{{ evaluation.communication ?? '—' }}</div></div>
        </div>
        <div *ngIf="evaluation.finalComments" style="margin-top: 16px;">
          <div class="kpi-label">Commentaires de l'encadrant</div>
          <p>{{ evaluation.finalComments }}</p>
        </div>
      </div>

      <div class="card" *ngIf="certificate">
        <h3>Attestation</h3>
        <p>Référence : <strong>{{ certificate.referenceNumber }}</strong></p>
        <p class="text-muted">Délivrée le {{ certificate.issuedDate }}</p>
        <button class="btn btn-primary" (click)="download()" [disabled]="downloading">
          {{ downloading ? 'Téléchargement...' : "Télécharger l'attestation (PDF)" }}
        </button>
        <span *ngIf="downloadError" class="badge badge-danger" style="margin-left: 12px;">{{ downloadError }}</span>
      </div>

      <div class="card" *ngIf="!certificate">
        <p class="text-muted">Votre attestation est en cours de préparation par l'administration.</p>
      </div>
    </div>
  `
})
export class ResultsComponent implements OnInit {
  completedRequest: InternshipRequest | null = null;
  evaluation: Evaluation | null = null;
  certificate: Certificate | null = null;
  downloading = false;
  downloadError = '';

  constructor(private api: ApiService) {}

  ngOnInit(): void {
    this.api.myRequests().subscribe((reqs) => {
      this.completedRequest = reqs.find((r) => r.status === 'COMPLETED') || null;
      if (this.completedRequest) {
        this.api.getResult(this.completedRequest.id).subscribe({
          next: (e) => (this.evaluation = e),
          error: () => (this.evaluation = null)
        });
        this.api.getCertificate(this.completedRequest.id).subscribe({
          next: (c) => (this.certificate = c),
          error: () => (this.certificate = null)
        });
      }
    });
  }

  download(): void {
    if (!this.completedRequest || !this.certificate) return;
    this.downloading = true;
    this.downloadError = '';
    this.api.downloadCertificate(this.completedRequest.id).subscribe({
      next: (blob) => {
        this.downloading = false;
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `attestation-${this.certificate!.referenceNumber.replace(/\//g, '-')}.pdf`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        window.URL.revokeObjectURL(url);
      },
      error: () => {
        this.downloading = false;
        this.downloadError = 'Impossible de télécharger l\'attestation.';
      }
    });
  }

  resultLabel(result: string): string {
    return label(EVALUATION_RESULT_LABELS, result);
  }

  resultClass(result: string): string {
    if (result === 'VERY_SATISFACTORY') return 'badge-success';
    if (result === 'SATISFACTORY') return 'badge-info';
    return 'badge-danger';
  }
}
