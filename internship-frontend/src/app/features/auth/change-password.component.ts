import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ApiService } from '../../core/services/api.service';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-change-password',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="auth-page">
      <div class="auth-card card">
        <h2>{{ mandatory ? 'Changement de mot de passe requis' : 'Changer mon mot de passe' }}</h2>
        <p class="text-muted" *ngIf="mandatory">
          Votre compte a été créé avec un mot de passe temporaire. Veuillez le changer avant de continuer.
        </p>

        <div class="form-group">
          <label>Mot de passe actuel</label>
          <input type="password" [(ngModel)]="currentPassword">
        </div>
        <div class="form-group">
          <label>Nouveau mot de passe</label>
          <input type="password" [(ngModel)]="newPassword">
        </div>
        <div class="form-group">
          <label>Confirmer le nouveau mot de passe</label>
          <input type="password" [(ngModel)]="confirmPassword">
        </div>

        <div *ngIf="error" class="badge badge-danger" style="margin-bottom: 16px;">{{ error }}</div>

        <button class="btn btn-primary" style="width: 100%; justify-content: center;" (click)="submit()" [disabled]="loading">
          {{ loading ? 'Enregistrement...' : 'Changer le mot de passe' }}
        </button>
      </div>
    </div>
  `,
  styles: [`
    .auth-page { min-height: 100vh; display: flex; align-items: center; justify-content: center; background: var(--color-panel); }
    .auth-card { width: 400px; }
  `]
})
export class ChangePasswordComponent {
  currentPassword = '';
  newPassword = '';
  confirmPassword = '';
  error = '';
  loading = false;

  constructor(private api: ApiService, private auth: AuthService, private router: Router) {}

  get mandatory(): boolean {
    return !!this.auth.currentUser()?.mustChangePassword;
  }

  submit(): void {
    this.error = '';
    if (!this.currentPassword || !this.newPassword) {
      this.error = 'Merci de remplir tous les champs.';
      return;
    }
    if (this.newPassword.length < 6) {
      this.error = 'Le nouveau mot de passe doit contenir au moins 6 caractères.';
      return;
    }
    if (this.newPassword !== this.confirmPassword) {
      this.error = 'Les mots de passe ne correspondent pas.';
      return;
    }

    this.loading = true;
    this.api.changePassword(this.currentPassword, this.newPassword).subscribe({
      next: () => {
        this.loading = false;
        this.auth.clearMustChangePassword();
        const role = this.auth.role();
        this.router.navigate([role ? this.auth.homeRouteForRole(role) : '/login']);
      },
      error: (err) => {
        this.loading = false;
        this.error = err.error?.message || 'Impossible de changer le mot de passe.';
      }
    });
  }
}
