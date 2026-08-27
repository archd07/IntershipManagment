import { Component, OnInit, DestroyRef, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { ApiService } from '../../core/services/api.service';
import { IconDotComponent } from '../icon-dot/icon-dot.component';
import { poll } from '../../core/util/polling';

interface NavItem {
  label: string;
  path: string;
}

@Component({
  selector: 'app-shell',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive, RouterOutlet, IconDotComponent],
  template: `
    <div class="shell">
      <aside class="sidebar">
        <nav>
          <button *ngFor="let item of navItems" type="button" [routerLink]="item.path" routerLinkActive="active" class="nav-pill">
            <app-icon-dot [size]="26"></app-icon-dot>
            {{ item.label }}
          </button>
        </nav>

        <div class="sidebar-footer">
          <div class="avatar-circle">{{ initials }}</div>
          <div class="admin-name">{{ auth.currentUser()?.fullName }}</div>
        </div>
      </aside>

      <div class="main">
        <header class="topbar">
          <div class="topbar-title">Espace {{ roleLabel }}</div>
          <div class="topbar-actions">
            <button type="button" routerLink="notifications" class="notif-link">
              <app-icon-dot [size]="24"></app-icon-dot>
              <span *ngIf="unread > 0" class="badge badge-danger">{{ unread }}</span>
            </button>
            <button class="btn btn-secondary" (click)="auth.logout()">Se déconnecter</button>
          </div>
        </header>

        <main class="content">
          <router-outlet></router-outlet>
        </main>
      </div>
    </div>
  `,
  styles: [`
    .shell { display: flex; min-height: 100vh; background: var(--color-bg); }
    .sidebar {
      width: 240px;
      background: #fff;
      border-right: 1.5px solid var(--color-border);
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      flex-shrink: 0;
      padding: 24px 16px;
    }
    nav { display: flex; flex-direction: column; gap: 12px; }
    .nav-pill {
      display: flex; align-items: center; gap: 12px;
      padding: 12px 16px; border-radius: var(--radius-pill);
      border: 1.5px solid var(--color-border);
      background: #fff;
      color: var(--color-text); font-size: 14px; font-weight: 500;
      width: 100%; text-align: left; appearance: none;
    }
    .nav-pill:hover { background: var(--color-panel); }
    .nav-pill.active { background: var(--color-accent); }

    .sidebar-footer { display: flex; flex-direction: column; align-items: center; gap: 8px; padding-top: 24px; }
    .avatar-circle {
      width: 56px; height: 56px; border-radius: 50%;
      border: 1.5px solid var(--color-border);
      display: flex; align-items: center; justify-content: center;
      font-size: 14px; font-weight: 700; background: #fff;
    }
    .admin-name { font-size: 12px; color: var(--color-text-muted); text-align: center; }

    .main { flex: 1; display: flex; flex-direction: column; min-width: 0; }
    .topbar {
      height: 68px; background: #fff; border-bottom: 1.5px solid var(--color-border);
      display: flex; align-items: center; justify-content: space-between; padding: 0 24px; flex-shrink: 0;
    }
    .topbar-title { font-weight: 600; color: var(--color-text-muted); font-size: 13px; text-transform: uppercase; letter-spacing: 0.03em; }
    .topbar-actions { display: flex; align-items: center; gap: 16px; }
    .notif-link {
      position: relative; display: flex; align-items: center;
      background: none; border: none; padding: 0; appearance: none; cursor: pointer;
    }
    .notif-link .badge {
      position: absolute; top: -8px; right: -10px; padding: 1px 6px; font-size: 10px;
    }
    .content { padding: 28px; flex: 1; }
  `]
})
export class ShellComponent implements OnInit {
  navItems: NavItem[] = [];
  roleLabel = '';
  unread = 0;

  private destroyRef = inject(DestroyRef);

  constructor(public auth: AuthService, private api: ApiService) {}

  get initials(): string {
    const name = this.auth.currentUser()?.fullName ?? '';
    return name.split(' ').map(p => p[0]).join('').slice(0, 2).toUpperCase();
  }

  ngOnInit(): void {
    const role = this.auth.role();
    if (role === 'ADMIN') {
      this.roleLabel = 'Administrateur';
      this.navItems = [
        { label: 'Tableau de bord', path: '/admin/dashboard' },
        { label: 'Demandes', path: '/admin/requests' },
        { label: 'Encadrants', path: '/admin/supervisors' },
        { label: 'Réclamations', path: '/admin/complaints' },
        { label: 'Notifications', path: '/admin/notifications' },
      ];
    } else if (role === 'SUPERVISOR') {
      this.roleLabel = 'Encadrant';
      this.navItems = [
        { label: 'Tableau de bord', path: '/supervisor/dashboard' },
        { label: 'Mes stagiaires', path: '/supervisor/interns' },
        { label: 'Tâches', path: '/supervisor/tasks' },
        { label: 'Notifications', path: '/supervisor/notifications' },
      ];
    } else if (role === 'STUDENT') {
      this.roleLabel = 'Étudiant';
      this.navItems = [
        { label: 'Tableau de bord', path: '/student/dashboard' },
        { label: 'Ma candidature', path: '/student/application' },
        { label: 'Calendrier', path: '/student/calendar' },
        { label: 'Tâches', path: '/student/tasks' },
        { label: 'Résultats', path: '/student/results' },
        { label: 'Réclamations', path: '/student/complaints' },
        { label: 'Notifications', path: '/student/notifications' },
      ];
    }

    // Poll every 5s so the notification badge updates without a manual refresh.
    poll(() => this.api.unreadNotificationCount(), this.destroyRef).subscribe({
      next: (r) => (this.unread = r.count),
      error: () => {}
    });
  }
}
