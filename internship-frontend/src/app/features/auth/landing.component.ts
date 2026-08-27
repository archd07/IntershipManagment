import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { IconDotComponent } from '../../shared/icon-dot/icon-dot.component';

@Component({
  selector: 'app-landing',
  standalone: true,
  imports: [RouterLink, IconDotComponent],
  template: `
    <header class="site-header">
      <div class="brand">
        <app-icon-dot [size]="30"></app-icon-dot>
        Gestion des Stages
      </div>
      <nav>
        <a routerLink="/login" class="btn btn-secondary">Connexion</a>
        <a routerLink="/apply" class="btn btn-primary">Postuler</a>
      </nav>
    </header>

    <section class="hero">
      <h1>Système de Gestion des Stages</h1>
      <p>
        Une plateforme centralisée pour gérer les demandes de stage, l'encadrement,
        la présence, l'évaluation et les attestations &mdash; de la candidature à l'attestation.
      </p>
      <div class="hero-actions">
        <a routerLink="/apply" class="btn btn-primary">Postuler pour un stage</a>
        <a routerLink="/login" class="btn btn-secondary">Connexion</a>
      </div>
      <p class="text-muted" style="margin-top: 16px;">
        <a routerLink="/track">Déjà postulé ? Suivre ma demande</a>
      </p>
    </section>

    <section class="features">
      <div class="feature card">
        <app-icon-dot [size]="26"></app-icon-dot>
        <h3 style="margin-top: 12px;">Gestion des candidatures</h3>
        <p class="text-muted">Soumettez, suivez et gérez les demandes de stage de bout en bout.</p>
      </div>
      <div class="feature card">
        <app-icon-dot [size]="26"></app-icon-dot>
        <h3 style="margin-top: 12px;">Affectation des encadrants</h3>
        <p class="text-muted">Une affectation qui respecte la capacité de chaque encadrant.</p>
      </div>
      <div class="feature card">
        <app-icon-dot [size]="26"></app-icon-dot>
        <h3 style="margin-top: 12px;">Suivi et évaluation</h3>
        <p class="text-muted">Présence, tâches et évaluation finale dans un seul flux.</p>
      </div>
      <div class="feature card">
        <app-icon-dot [size]="26"></app-icon-dot>
        <h3 style="margin-top: 12px;">Attestations</h3>
        <p class="text-muted">Attestations officielles générées automatiquement à la fin du stage.</p>
      </div>
    </section>

    <footer class="site-footer">
      <p class="text-muted">&copy; 2026 Système de Gestion des Stages</p>
    </footer>
  `,
  styles: [`
    :host { display: block; background: #fff; min-height: 100vh; }
    .site-header {
      display: flex; justify-content: space-between; align-items: center;
      padding: 20px 48px; border-bottom: 1.5px solid var(--color-border);
    }
    .brand { display: flex; align-items: center; gap: 10px; font-weight: 700; font-size: 16px; }
    nav { display: flex; align-items: center; gap: 12px; }
    .hero { text-align: center; padding: 96px 24px; background: var(--color-panel); }
    .hero h1 { font-size: 36px; max-width: 700px; margin: 0 auto 16px; }
    .hero p { max-width: 560px; margin: 0 auto 32px; color: var(--color-text-muted); font-size: 15px; }
    .hero-actions { display: flex; gap: 12px; justify-content: center; }
    .features {
      display: grid; grid-template-columns: repeat(4, 1fr); gap: 20px;
      max-width: 1100px; margin: 0 auto; padding: 64px 24px;
    }
    @media (max-width: 900px) { .features { grid-template-columns: 1fr; } }
    .site-footer { text-align: center; padding: 32px; border-top: 1.5px solid var(--color-border); }
  `]
})
export class LandingComponent {}
