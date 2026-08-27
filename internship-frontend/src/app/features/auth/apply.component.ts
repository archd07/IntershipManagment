import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { ApiService } from '../../core/services/api.service';
import { MOROCCAN_UNIVERSITIES, ACADEMIC_LEVELS, INTERNSHIP_TYPES, MoroccanUniversity, getAcademicYearOptions, getSpecialtiesForSchool } from '../../core/data/morocco-academic-data';

@Component({
  selector: 'app-apply',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="auth-page">
      <div class="auth-card card">
        <h2>Postuler pour un stage</h2>
        <p class="text-muted">
          Aucun compte n'est nécessaire pour postuler. Si votre demande est acceptée,
          votre compte étudiant sera créé automatiquement et vous recevrez un mot de passe
          temporaire de la part de l'administration.
        </p>

        <div *ngIf="!submitted">
          <h4>Informations personnelles</h4>
          <div class="grid grid-2">
            <div class="form-group"><label>Prénom</label><input [(ngModel)]="form.firstName"></div>
            <div class="form-group"><label>Nom</label><input [(ngModel)]="form.lastName"></div>
          </div>
          <div class="form-group"><label>Email</label><input type="email" [(ngModel)]="form.email"></div>
          <div class="grid grid-2">
            <div class="form-group"><label>Téléphone</label><input [(ngModel)]="form.phone"></div>
            <div class="form-group"><label>CIN</label><input [(ngModel)]="form.cin"></div>
          </div>

          <h4>Parcours académique</h4>
          <div class="form-group">
            <label>Université</label>
            <select [(ngModel)]="selectedUniversity" (ngModelChange)="onUniversityChange()">
              <option [ngValue]="null">Sélectionner...</option>
              <option *ngFor="let u of universities" [ngValue]="u">{{ u.name }}</option>
            </select>
          </div>
          <div class="grid grid-2">
            <div class="form-group">
              <label>École / Faculté</label>
              <select [(ngModel)]="form.school" (ngModelChange)="onSchoolChange()" [disabled]="!selectedUniversity">
                <option value="">Sélectionner...</option>
                <option *ngFor="let s of availableSchools" [value]="s">{{ s }}</option>
              </select>
            </div>
            <div class="form-group">
              <label>Niveau</label>
              <select [(ngModel)]="form.level">
                <option value="">Sélectionner...</option>
                <option *ngFor="let l of levels" [value]="l">{{ l }}</option>
              </select>
            </div>
          </div>
          <div class="form-group" style="max-width: 240px;">
            <label>Année académique</label>
            <select [(ngModel)]="form.academicYear">
              <option value="">Sélectionner...</option>
              <option value="">2026-2025</option>
            </select>
          </div>

          <h4>Détails du stage</h4>
          <div class="form-group">
            <label>Type de stage</label>
            <select [(ngModel)]="form.internshipType">
              <option value="">Sélectionner...</option>
              <option *ngFor="let t of internshipTypes" [value]="t">{{ t }}</option>
            </select>
          </div>
          <div class="grid grid-2">
            <div class="form-group"><label>Date de début</label><input type="date" [(ngModel)]="form.startDate"></div>
            <div class="form-group"><label>Date de fin</label><input type="date" [(ngModel)]="form.endDate"></div>
          </div>
          <div class="form-group" *ngIf="computedDuration !== null">
            <label>Durée (calculée automatiquement)</label>
            <input [value]="computedDuration + ' semaines'" disabled>
          </div>
          <div class="form-group">
            <label>Spécialité</label>
            <select [(ngModel)]="form.specialty" [disabled]="!form.school">
              <option value="">{{ form.school ? 'Sélectionner...' : 'Choisir une école d’abord' }}</option>
              <option *ngFor="let specialty of availableSpecialties" [value]="specialty">{{ specialty }}</option>
            </select>
          </div>

          <div class="form-group">
            <label for="cv">CV</label>
            <input id="cv" type="file" accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document" (change)="onCvSelected($event)">
            <small class="text-muted" *ngIf="cvFile">{{ cvFile.name }}</small>
            <small class="text-muted">PDF, DOC ou DOCX, 5 Mo maximum</small>
          </div>

          <div *ngIf="error" class="badge badge-danger" style="margin-bottom: 16px;">{{ error }}</div>

          <button class="btn btn-primary" style="width: 100%; justify-content: center;" (click)="submit()" [disabled]="loading">
            {{ loading ? 'Envoi en cours...' : 'Envoyer ma demande' }}
          </button>

          <p class="text-muted" style="margin-top: 16px; text-align: center;">
            Déjà un compte ? <a routerLink="/login">Se connecter</a>
          </p>
        </div>

        <div *ngIf="submitted" class="card" style="background: var(--color-accent);">
          <strong>Demande envoyée avec succès.</strong>
          <p style="margin-top: 8px;">
            Vous recevrez un compte automatiquement si votre demande est acceptée.
            Vous pouvez suivre son statut à tout moment.
          </p>
          <a routerLink="/track" class="btn btn-secondary" style="margin-top: 8px;">Suivre ma demande</a>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .auth-page { min-height: 100vh; display: flex; align-items: center; justify-content: center; background: var(--color-panel); padding: 40px 0; }
    .auth-card { width: 560px; }
    h4 { margin-top: 24px; margin-bottom: 12px; }
  `]
})
export class ApplyComponent {
  universities = MOROCCAN_UNIVERSITIES;
  levels = ACADEMIC_LEVELS;
  internshipTypes = INTERNSHIP_TYPES;
  academicYears = getAcademicYearOptions();
  selectedUniversity: MoroccanUniversity | null = null;
  availableSchools: string[] = [];
  availableSpecialties: string[] = [];

  form: any = {
    firstName: '', lastName: '', email: '', phone: '', cin: '',
    university: '', school: '', level: '', academicYear: '',
    internshipType: '', startDate: '', endDate: '', specialty: ''
  };

  error = '';
  loading = false;
  submitted = false;
  cvFile: File | null = null;

  constructor(private api: ApiService, private router: Router) {}

  get computedDuration(): number | null {
    if (!this.form.startDate || !this.form.endDate) return null;
    const start = new Date(this.form.startDate).getTime();
    const end = new Date(this.form.endDate).getTime();
    if (end < start) return null;
    const days = Math.round((end - start) / (1000 * 60 * 60 * 24));
    return Math.ceil(days / 7);
  }

  onUniversityChange(): void {
    this.availableSchools = this.selectedUniversity?.schools ?? [];
    this.form.school = '';
    this.availableSpecialties = [];
    this.form.specialty = '';
  }

  onSchoolChange(): void {
    this.availableSpecialties = getSpecialtiesForSchool(this.form.school);
    this.form.specialty = '';
  }

  onCvSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0] ?? null;
    this.cvFile = null;

    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      this.error = 'Le CV ne doit pas dépasser 5 Mo.';
      input.value = '';
      return;
    }

    this.error = '';
    this.cvFile = file;
  }

  submit(): void {
    this.error = '';
    if (!this.form.firstName || !this.form.lastName || !this.form.email || !this.form.startDate || !this.form.endDate) {
      this.error = 'Merci de renseigner au minimum votre nom, prénom, email, et les dates du stage.';
      return;
    }

    this.form.university = this.selectedUniversity?.name ?? '';
    this.loading = true;

    this.api.publicApply(this.form).subscribe({
      next: () => {
        this.loading = false;
        this.submitted = true;
      },
      error: (err) => {
        this.loading = false;
        this.error = err.error?.message || 'Impossible d\'envoyer la demande.';
      }
    });
  }
}
