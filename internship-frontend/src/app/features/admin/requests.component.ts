import { Component, DestroyRef, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { ApiService } from '../../core/services/api.service';
import { InternshipRequest, RequestStatus, SupervisorOption } from '../../core/models/models';
import { label, REQUEST_STATUS_LABELS } from '../../core/data/labels';
import { poll } from '../../core/util/polling';
import { trackById } from '../../core/util/track-by';

interface StatusChip {
  label: string;
  value?: RequestStatus;
}

@Component({
  selector: 'app-admin-requests',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="page-header">
      <h2>Demandes</h2>
    </div>

    <div *ngIf="loadError" class="badge badge-danger" style="margin-bottom: 16px;">{{ loadError }}</div>

    <div *ngIf="loading" class="card text-muted">Chargement des demandes...</div>

    <div *ngIf="!loading" class="grid" style="grid-template-columns: 400px 1fr; gap: 20px; align-items: start;">
      <div>
        <input class="search-pill" placeholder="Recherche" [(ngModel)]="search">

        <div class="chip-row">
          <button *ngFor="let c of chips" class="chip" [class.active]="statusFilter === c.value" (click)="setFilter(c.value)">
            {{ c.label }}
          </button>
        </div>

        <div>
          <div *ngFor="let r of filteredRequests; trackBy: trackById" class="list-row" [class.selected]="selected?.id === r.id" (click)="select(r)">
            <div class="list-row-avatar"></div>
            <div style="flex: 1;">
              <div class="list-row-title">{{ displayName(r) }}</div>
              <div class="list-row-sub">{{ r.internshipType || 'Stage' }}<span *ngIf="!r.student"> &middot; candidat sans compte</span></div>
            </div>
            <div class="list-row-meta">
              {{ r.durationInWeeks }} semaines<br>
              <span class="badge" [ngClass]="statusClass(r.status)" style="margin-top: 4px;">{{ statusLabel(r.status) }}</span>
            </div>
          </div>
          <div *ngIf="filteredRequests.length === 0" class="card text-muted">Aucune demande trouvée.</div>
        </div>
      </div>

      <div class="card" *ngIf="selected" style="min-height: 420px;">
        <div class="page-header">
          <h3 style="margin: 0;">{{ displayName(selected) }}</h3>
          <span class="badge" [ngClass]="statusClass(selected.status)">{{ statusLabel(selected.status) }}</span>
        </div>

        <div class="grid grid-3" style="margin-bottom: 20px;">
          <div><div class="kpi-label">Email</div><div>{{ selected.student?.email || selected.applicantEmail || '—' }}</div></div>
          <div><div class="kpi-label">Téléphone</div><div>{{ selected.student?.phone || selected.applicantPhone || '—' }}</div></div>
          <div><div class="kpi-label">Compte</div><div>{{ selected.student ? 'Créé' : 'Pas encore créé (candidat)' }}</div></div>
          <div><div class="kpi-label">Université</div><div>{{ selected.applicantUniversity || '—' }}</div></div>
          <div><div class="kpi-label">École</div><div>{{ selected.applicantSchool || '—' }}</div></div>
          <div><div class="kpi-label">Niveau</div><div>{{ selected.applicantLevel || '—' }}</div></div>
        </div>

        <div class="grid grid-3" style="margin-bottom: 20px;">
          <div><div class="kpi-label">Type de stage</div><div>{{ selected.internshipType || '—' }}</div></div>
          <div><div class="kpi-label">Durée</div><div>{{ selected.durationInWeeks }} semaines</div></div>
          <div><div class="kpi-label">Entité affectée</div><div>{{ selected.entity || 'Pas encore affectée' }}</div></div>
          <div><div class="kpi-label">Spécialité</div><div>{{ selected.specialty || '—' }}</div></div>
          <div><div class="kpi-label">Début / Fin</div><div>{{ selected.startDate || '—' }} &rarr; {{ selected.endDate || '—' }}</div></div>
          <div><div class="kpi-label">Encadrant</div><div>{{ selected.supervisor ? (selected.supervisor.firstName + ' ' + selected.supervisor.lastName) : 'Non affecté' }}</div></div>
        </div>

        <div *ngIf="studentPendingTemporaryPassword" class="card" style="background: var(--color-accent); margin-bottom: 20px;">
          <strong>Compte étudiant créé.</strong> Mot de passe temporaire à communiquer au candidat :
          <div style="font-family: monospace; font-size: 18px; margin-top: 8px;">{{ studentPendingTemporaryPassword }}</div>
          <p class="text-muted" style="font-size: 12px; margin-top: 8px;">
            Ce message disparaîtra automatiquement dès que l'étudiant se sera connecté et aura changé son mot de passe.
          </p>
        </div>

        <div *ngIf="actionError" class="badge badge-danger" style="margin-bottom: 16px;">{{ actionError }}</div>

        <div *ngIf="showReject" class="form-group">
          <label>Motif du rejet</label>
          <textarea rows="2" [(ngModel)]="rejectReason"></textarea>
        </div>

        <div *ngIf="['ACCEPTED', 'ASSIGNED'].includes(selected.status)" class="form-group">
          <label>{{ selected.status === 'ASSIGNED' ? 'Modifier l\\'encadrant' : 'Affecter un encadrant (une seule fois)' }}</label>
          <select [(ngModel)]="chosenSupervisorId">
            <option [ngValue]="null">Sélectionner...</option>
            <option *ngFor="let s of supervisors; trackBy: trackById" [ngValue]="s.id">
              {{ s.firstName }} {{ s.lastName }} — {{ s.entity || 'Entité non définie' }} ({{ s.currentInterns }}/{{ s.maxInterns }})
            </option>
          </select>
          <p class="text-muted" style="font-size: 12px; margin-top: 8px;" *ngIf="selected.status !== 'ASSIGNED'">
            L'affectation initiale ne se fait qu'une seule fois. L'entité organisationnelle est affectée automatiquement selon l'encadrant choisi.
          </p>
          <p class="text-muted" style="font-size: 12px; margin-top: 8px;" *ngIf="selected.status === 'ASSIGNED'">
            Le stagiaire est déjà affecté à {{ selected.supervisor?.firstName }} {{ selected.supervisor?.lastName }}. Choisissez un autre encadrant pour modifier l'affectation.
          </p>
        </div>

        <div *ngIf="selected.status === 'COMPLETED'">
          <span *ngIf="certMessage" class="badge badge-success">{{ certMessage }}</span>
          <button *ngIf="certGenerated" class="btn btn-secondary" style="margin-left: 12px;" (click)="downloadCertificate()">
            Télécharger l'attestation (PDF)
          </button>
        </div>
      </div>

      <div class="card text-muted" *ngIf="!selected">
        Sélectionnez une demande pour voir les détails.
      </div>
    </div>

    <div class="action-bar" *ngIf="!loading && selected" style="margin-top: -1px; max-width: none;">
      <ng-container [ngSwitch]="true">
        <ng-container *ngSwitchCase="['SUBMITTED','PENDING'].includes(selected.status)">
          <button class="btn btn-secondary" (click)="toggleReject()">{{ showReject ? 'annuler' : 'rejeter' }}</button>
          <button class="btn btn-primary" (click)="showReject ? reject() : accept()">
            {{ showReject ? 'confirmer le rejet' : 'confirmer l\\'acceptation' }}
          </button>
        </ng-container>

        <ng-container *ngSwitchCase="['ACCEPTED','ASSIGNED'].includes(selected.status)">
          <button *ngIf="selected.status === 'ASSIGNED'" class="btn btn-secondary" (click)="removeIntern()">retirer l'affectation</button>
          <button class="btn btn-primary" (click)="assignSupervisor()" [disabled]="!canConfirmAssignment">
            {{ selected.status === 'ASSIGNED' ? 'confirmer la modification' : 'confirmer l\\'affectation' }}
          </button>
        </ng-container>

        <ng-container *ngSwitchCase="selected.status === 'COMPLETED'">
          <button class="btn btn-primary" (click)="generateCertificate()">générer l'attestation</button>
        </ng-container>
      </ng-container>
    </div>
  `
})
export class AdminRequestsComponent implements OnInit {
  requests: InternshipRequest[] = [];
  selected: InternshipRequest | null = null;
  supervisors: SupervisorOption[] = [];
  statusFilter?: RequestStatus;
  search = '';
  showReject = false;
  rejectReason = '';
  chosenSupervisorId: number | null = null;
  certMessage = '';
  certGenerated = false;
  loadError = '';
  actionError = '';
  loading = true;
  // Persists until the student logs in and changes their password (see
  // AdminRequestDetail) — repopulated every time a request is selected or
  // refreshed, not just right after accept().
  studentPendingTemporaryPassword: string | null = null;
  readonly trackById = trackById;

  chips: StatusChip[] = [
    { label: 'Toutes', value: undefined },
    { label: 'Soumises', value: 'SUBMITTED' },
    { label: 'Acceptées', value: 'ACCEPTED' },
    { label: 'Affectées', value: 'ASSIGNED' },
    { label: 'Rejetées', value: 'REJECTED' },
  ];

  constructor(private api: ApiService) {}

  private destroyRef = inject(DestroyRef);
  private selectedId$ = new Subject<number>();

  get filteredRequests(): InternshipRequest[] {
    const term = this.search.trim().toLowerCase();
    if (!term) return this.requests;
    return this.requests.filter((r) =>
      this.displayName(r).toLowerCase().includes(term)
      || (r.internshipType ?? '').toLowerCase().includes(term)
    );
  }

  // The confirm button for supervisor assignment is disabled unless the admin
  // actually picked someone different from who's already assigned — prevents
  // pointless "reassign to the same person" submissions.
  get canConfirmAssignment(): boolean {
    if (!this.chosenSupervisorId) return false;
    if (!this.selected) return false;
    return this.chosenSupervisorId !== (this.selected.supervisor?.id ?? null);
  }

  displayName(r: InternshipRequest): string {
    if (r.student) return `${r.student.firstName} ${r.student.lastName}`;
    return `${r.applicantFirstName ?? ''} ${r.applicantLastName ?? ''}`.trim() || 'Candidat';
  }

  ngOnInit(): void {
    this.api.allSupervisors().subscribe({
      next: (s) => (this.supervisors = s),
      error: () => (this.loadError = 'Impossible de charger la liste des encadrants.')
    });

    // Poll every 6s so new/updated requests appear without a manual refresh.
    // `loading` only ever gets set to false once, on the first successful
    // response — the page stays on the loading state until real data arrives,
    // instead of flashing an empty list first.
    poll(() => this.api.allRequests(this.statusFilter), this.destroyRef, 6000).subscribe({
      next: (data) => {
        this.requests = data;
        this.loadError = '';
        this.loading = false;
        if (this.selected) {
          this.selected = data.find((r) => r.id === this.selected!.id) ?? this.selected;
        }
      },
      error: () => {
        this.loadError = 'Impossible de charger les demandes.';
        this.loading = false;
      }
    });

    // Whenever a request is selected, poll its detail every 5s — this is what
    // makes the pending-password panel disappear on its own, live, the moment
    // the student/supervisor actually changes their password, without the
    // admin needing to re-click anything.
    this.selectedId$.pipe(
      switchMap((id) => poll(() => this.api.getRequest(id), this.destroyRef, 5000))
    ).subscribe({
      next: (detail) => {
        this.selected = detail.request;
        this.studentPendingTemporaryPassword = detail.studentPendingTemporaryPassword;
      },
      error: () => {}
    });
  }

  load(): void {
    this.api.allRequests(this.statusFilter).subscribe({
      next: (data) => { this.requests = data; this.loadError = ''; },
      error: () => (this.loadError = 'Impossible de charger les demandes.')
    });
  }

  setFilter(status?: RequestStatus): void {
    this.statusFilter = status;
    this.load();
  }

  select(r: InternshipRequest): void {
    this.selected = r;
    this.showReject = false;
    this.rejectReason = '';
    this.chosenSupervisorId = r.supervisor?.id ?? null;
    this.certMessage = '';
    this.certGenerated = false;
    this.actionError = '';
    this.studentPendingTemporaryPassword = null;
    // Triggers the live poll (set up in ngOnInit) for this request's detail,
    // including the pending password.
    this.selectedId$.next(r.id);

    // Check whether a certificate already exists (e.g. generated in a
    // previous visit) so the download button shows up immediately.
    if (r.status === 'COMPLETED') {
      this.api.getCertificate(r.id).subscribe({
        next: () => (this.certGenerated = true),
        error: () => (this.certGenerated = false)
      });
    }
  }

  toggleReject(): void {
    this.showReject = !this.showReject;
  }

  refreshSelected(): void {
    // Immediate refetch for snappy feedback right after an action; the
    // selectedId$ poll (started in ngOnInit) keeps refreshing this same
    // request in the background afterwards, which is what makes the
    // pending-password panel disappear live once it's actually cleared.
    if (this.selected) {
      this.api.getRequest(this.selected.id).subscribe({
        next: (detail) => {
          this.selected = detail.request;
          this.studentPendingTemporaryPassword = detail.studentPendingTemporaryPassword;
          this.chosenSupervisorId = detail.request.supervisor?.id ?? null;
        },
        error: () => {}
      });
    }
    this.load();
  }

  accept(): void {
    if (!this.selected) return;
    this.actionError = '';
    this.api.acceptRequest(this.selected.id).subscribe({
      next: (result) => {
        this.selected = result.request;
        this.studentPendingTemporaryPassword = result.temporaryPassword;
        this.load();
      },
      error: (err) => (this.actionError = err.error?.message || 'Impossible d\'accepter la demande.')
    });
  }

  reject(): void {
    if (!this.selected) return;
    this.actionError = '';
    this.api.rejectRequest(this.selected.id, this.rejectReason).subscribe({
      next: () => { this.showReject = false; this.refreshSelected(); },
      error: (err) => (this.actionError = err.error?.message || 'Impossible de rejeter la demande.')
    });
  }

  assignSupervisor(): void {
    if (!this.selected || !this.chosenSupervisorId || !this.canConfirmAssignment) return;
    this.actionError = '';
    const call = this.selected.status === 'ASSIGNED'
      ? this.api.changeSupervisor(this.selected.id, this.chosenSupervisorId)
      : this.api.assignSupervisor(this.selected.id, this.chosenSupervisorId);
    call.subscribe({
      next: () => this.refreshSelected(),
      error: (err) => (this.actionError = err.error?.message || 'Impossible d\'affecter l\'encadrant.')
    });
  }

  removeIntern(): void {
    if (!this.selected) return;
    this.api.removeIntern(this.selected.id).subscribe({
      next: () => this.refreshSelected(),
      error: (err) => (this.actionError = err.error?.message || 'Une erreur est survenue.')
    });
  }

  generateCertificate(): void {
    if (!this.selected) return;
    this.api.generateCertificate(this.selected.id).subscribe({
      next: () => {
        this.certMessage = 'Attestation générée.';
        this.certGenerated = true;
      },
      error: (err) => (this.actionError = err.error?.message || 'Impossible de générer l\'attestation.')
    });
  }

  downloadCertificate(): void {
    if (!this.selected) return;
    this.api.downloadCertificate(this.selected.id).subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `attestation-${this.selected!.id}.pdf`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        window.URL.revokeObjectURL(url);
      },
      error: () => (this.actionError = 'Impossible de télécharger l\'attestation.')
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
