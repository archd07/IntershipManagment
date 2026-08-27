import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="auth-page">
      <div class="auth-card card">
        <h2>Connexion</h2>
        <p class="text-muted">Accédez à votre tableau de bord de stage.</p>

        <div class="form-group">
          <label>Email</label>
          <input type="email" [(ngModel)]="email" placeholder="vous@exemple.com">
        </div>
        <div class="form-group">
          <label>Mot de passe</label>
          <input type="password" [(ngModel)]="password" placeholder="••••••••">
        </div>

        <div *ngIf="error" class="badge badge-danger" style="margin-bottom: 16px;">{{ error }}</div>

        <button class="btn btn-primary" style="width: 100%; justify-content: center;" (click)="submit()" [disabled]="loading">
          {{ loading ? 'Connexion en cours...' : 'Se connecter' }}
        </button>

        <p class="text-muted" style="margin-top: 16px; text-align: center;">
          Vous n'avez pas encore de compte ? <a routerLink="/apply">Déposer une demande de stage</a>
        </p>
        <p class="text-muted" style="margin-top: 8px; text-align: center;">
          <a routerLink="/track">Suivre ma demande</a>
        </p>
      </div>
    </div>
  `,
  styles: [`
    .auth-page { min-height: 100vh; display: flex; align-items: center; justify-content: center; background: var(--color-panel); }
    .auth-card { width: 380px; }
  `]
})
export class LoginComponent {
  email = '';
  password = '';
  error = '';
  loading = false;

  constructor(private auth: AuthService, private router: Router) {}

  submit(): void {
    this.error = '';
    if (!this.email || !this.password) {
      this.error = 'Merci de saisir votre email et votre mot de passe.';
      return;
    }
    this.loading = true;
    this.auth.login(this.email, this.password).subscribe({
      next: (res) => {
        this.loading = false;
        this.router.navigate([this.auth.postLoginRoute(res)]);
      },
      error: (err) => {
        this.loading = false;
        this.error = err.error?.message || 'Email ou mot de passe invalide.';
      }
    });
  }
}
