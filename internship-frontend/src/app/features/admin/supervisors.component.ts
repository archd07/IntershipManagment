import { Component, DestroyRef, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { ApiService } from '../../core/services/api.service';
import { InternshipRequest, SupervisorProfile, SupervisorOption } from '../../core/models/models';
import { label, REQUEST_STATUS_LABELS } from '../../core/data/labels';
import { ORGANIZATIONAL_ENTITIES } from '../../core/data/morocco-academic-data';
import { poll } from '../../core/util/polling';
import { trackById } from '../../core/util/track-by';

@Component({
  selector: 'app-admin-supervisors',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="page-header">
      <h2>Encadrants</h2>
      <button class="btn btn-primary" (click)="showAdd = !showAdd">{{ showAdd ? 'Annuler' : '+ Ajouter un encadrant' }}</button>
    </div>

    <div *ngIf="loadError" class="badge badge-danger" style="margin-bottom: 16px;">{{ loadError }}</div>

    <div class="card" *ngIf="showAdd" style="margin-bottom: 20px;">
      <h3>Nouvel encadrant</h3>
      <div class="grid grid-2">
        <div class="form-group"><label>Prénom</label><input [(ngModel)]="form.firstName"></div>
        <div class="form-group"><label>Nom</label><input [(ngModel)]="form.lastName"></div>
      </div>
      <div class="grid grid-2">
        <div class="form-group"><label>Email</label><input [(ngModel)]="form.email"></div>
        <div class="form-group"><label>Téléphone</label><input [(ngModel)]="form.phone"></div>
      </div>
      <div class="form-group">
        <label>Entité organisationnelle</label>
        <select [(ngModel)]="form.entity">
          <option value="">Sélectionner...</option>
          <option *ngFor="let e of entities" [value]="e">{{ e }}</option>
        </select>
      </div>
      <div class="form-group" style="max-width: 200px;">
        <label>Nombre maximum de stagiaires</label>
        <input type="number" [(ngModel)]="form.maxInterns">
      </div>
      <button class="btn btn-primary" (click)="create()">Créer le compte encadrant</button>
      <span *ngIf="message" class="badge badge-success" style="margin-left: 12px;">{{ message }}</span>
    </div>

    <div *ngIf="loading" class="card text-muted">Chargement des encadrants...</div>

    <div *ngIf="!loading" class="grid" style="grid-template-columns: 380px 1fr; gap: 20px; align-items: start;">
      <div>
        <div *ngFor="let s of supervisors; trackBy: trackById" class="list-row" [class.selected]="selected?.id === s.id" (click)="select(s)">
          <div class="list-row-avatar"></div>
          <div>
            <div class="list-row-title">{{ s.firstName }} {{ s.lastName }}</div>
            <div class="list-row-sub">{{ s.entity || 'Entité non définie' }} &middot; {{ s.currentInterns }}/{{ s.maxInterns }}</div>
          </div>
        </div>
        <div *ngIf="supervisors.length === 0" class="card text-muted">Aucun encadrant pour le moment.</div>
      </div>

      <div *ngIf="selectedProfile" class="card">
        <h3>{{ selected?.firstName }} {{ selected?.lastName }}</h3>
        <div class="grid grid-2" style="margin-bottom: 20px;">
          <div><div class="kpi-label">Entité</div><div>{{ selectedProfile.entity || '—' }}</div></div>
          <div><div class="kpi-label">Capacité</div><div>{{ selectedProfile.currentInterns }} / {{ selectedProfile.maxInterns }}</div></div>
        </div>

        <div *ngIf="selectedProfile.pendingTemporaryPassword" class="card" style="background: var(--color-accent); margin-bottom: 20px;">
          <strong>Mot de passe temporaire en attente.</strong> À communiquer à l'encadrant :
          <div style="font-family: monospace; font-size: 18px; margin-top: 8px;">{{ selectedProfile.pendingTemporaryPassword }}</div>
          <p class="text-muted" style="font-size: 12px; margin-top: 8px;">
            Ce message disparaîtra automatiquement dès que l'encadrant se sera connecté et aura changé son mot de passe.
          </p>
        </div>

        <div class="form-group" style="max-width: 260px;">
          <label>Modifier la capacité maximale</label>
          <div style="display:flex; gap:8px;">
            <input type="number" [(ngModel)]="newMax">
            <button class="btn btn-secondary" (click)="updateCapacity()">Enregistrer</button>
          </div>
        </div>

        <h4>Stagiaires affectés</h4>
        <table>
          <thead><tr><th>Étudiant</th><th>Statut</th></tr></thead>
          <tbody>
            <tr *ngFor="let i of interns; trackBy: trackById">
              <td>{{ i.student?.firstName }} {{ i.student?.lastName }}</td>
              <td><span class="badge badge-info">{{ statusLabel(i.status) }}</span></td>
            </tr>
            <tr *ngIf="interns.length === 0"><td colspan="2" class="text-muted">Aucun stagiaire affecté.</td></tr>
          </tbody>
        </table>
      </div>

      <div *ngIf="!selectedProfile" class="card text-muted">
        Sélectionnez un encadrant pour voir les détails.
      </div>
    </div>
  `
})
export class AdminSupervisorsComponent implements OnInit {
  supervisors: SupervisorOption[] = [];
  selected: SupervisorOption | null = null;
  selectedProfile: SupervisorProfile | null = null;
  interns: InternshipRequest[] = [];
  entities = ORGANIZATIONAL_ENTITIES;
  showAdd = false;
  message = '';
  loadError = '';
  newMax = 0;
  temporaryPassword: string | null = null;
  loading = true;

  form: any = { firstName: '', lastName: '', email: '', phone: '', entity: '', maxInterns: 5 };
  readonly trackById = trackById;

  constructor(private api: ApiService) {}

  private destroyRef = inject(DestroyRef);
  private selectedId$ = new Subject<number>();

  ngOnInit(): void {
    // Poll every 6s so newly created supervisors or capacity changes appear
    // without a manual refresh. `loading` only ever flips to false once, on
    // the first response — avoids flashing an empty list before data arrives.
    poll(() => this.api.allSupervisors(), this.destroyRef, 6000).subscribe({
      next: (data) => { this.supervisors = data; this.loadError = ''; this.loading = false; },
      error: () => { this.loadError = 'Impossible de charger la liste des encadrants.'; this.loading = false; }
    });

    // Whenever a supervisor is selected, poll its profile every 5s — this is
    // what makes the pending-password panel disappear on its own, live, the
    // moment the supervisor actually changes their password.
    this.selectedId$.pipe(
      switchMap((id) => poll(() => this.api.supervisorProfile(id), this.destroyRef, 5000))
    ).subscribe({
      next: (p) => {
        this.selectedProfile = p;
        this.newMax = p.maxInterns;
      },
      error: () => {}
    });
  }

  load(): void {
    this.api.allSupervisors().subscribe({
      next: (data) => { this.supervisors = data; this.loadError = ''; },
      error: () => (this.loadError = 'Impossible de charger la liste des encadrants.')
    });
  }

  select(s: SupervisorOption): void {
    this.selected = s;
    this.selectedId$.next(s.id);
    this.api.supervisorInterns(s.id).subscribe((data) => (this.interns = data));
  }

  updateCapacity(): void {
    if (!this.selected) return;
    this.api.updateSupervisorCapacity(this.selected.id, this.newMax).subscribe((p) => (this.selectedProfile = p));
  }

  create(): void {
    if (!this.form.firstName || !this.form.lastName || !this.form.email) return;
    this.api.createSupervisor(this.form).subscribe({
      next: (result) => {
        this.message = 'Compte encadrant créé.';
        this.temporaryPassword = result.temporaryPassword;
        this.form = { firstName: '', lastName: '', email: '', phone: '', entity: '', maxInterns: 5 };
        this.load();
      },
      error: (err) => (this.message = err.error?.message || 'Impossible de créer le compte.')
    });
  }

  statusLabel(status: string): string {
    return label(REQUEST_STATUS_LABELS, status);
  }
}
