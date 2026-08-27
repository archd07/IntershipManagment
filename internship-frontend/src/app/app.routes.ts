import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { roleGuard } from './core/guards/role.guard';
import { ShellComponent } from './shared/shell/shell.component';
import { NotificationsComponent } from './shared/notifications/notifications.component';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./features/auth/landing.component').then(m => m.LandingComponent)
  },
  {
    path: 'login',
    loadComponent: () => import('./features/auth/login.component').then(m => m.LoginComponent)
  },
  {
    path: 'apply',
    loadComponent: () => import('./features/auth/apply.component').then(m => m.ApplyComponent)
  },
  {
    path: 'track',
    loadComponent: () => import('./features/auth/track.component').then(m => m.TrackComponent)
  },
  {
    path: 'change-password',
    canActivate: [authGuard],
    loadComponent: () => import('./features/auth/change-password.component').then(m => m.ChangePasswordComponent)
  },

  {
    path: 'admin',
    component: ShellComponent,
    canActivate: [authGuard, roleGuard(['ADMIN'])],
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      { path: 'dashboard', loadComponent: () => import('./features/admin/dashboard.component').then(m => m.AdminDashboardComponent) },
      { path: 'requests', loadComponent: () => import('./features/admin/requests.component').then(m => m.AdminRequestsComponent) },
      { path: 'supervisors', loadComponent: () => import('./features/admin/supervisors.component').then(m => m.AdminSupervisorsComponent) },
      { path: 'complaints', loadComponent: () => import('./features/admin/complaints.component').then(m => m.AdminComplaintsComponent) },
      { path: 'notifications', component: NotificationsComponent },
    ]
  },

  {
    path: 'supervisor',
    component: ShellComponent,
    canActivate: [authGuard, roleGuard(['SUPERVISOR'])],
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      { path: 'dashboard', loadComponent: () => import('./features/supervisor/dashboard.component').then(m => m.SupervisorDashboardComponent) },
      { path: 'interns', loadComponent: () => import('./features/supervisor/interns.component').then(m => m.SupervisorInternsComponent) },
      { path: 'tasks', loadComponent: () => import('./features/supervisor/tasks.component').then(m => m.SupervisorTasksComponent) },
      { path: 'notifications', component: NotificationsComponent },
    ]
  },

  {
    path: 'student',
    component: ShellComponent,
    canActivate: [authGuard, roleGuard(['STUDENT'])],
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      { path: 'dashboard', loadComponent: () => import('./features/student/dashboard.component').then(m => m.StudentDashboardComponent) },
      { path: 'application', loadComponent: () => import('./features/student/application.component').then(m => m.ApplicationComponent) },
      { path: 'calendar', loadComponent: () => import('./features/student/calendar.component').then(m => m.CalendarComponent) },
      { path: 'tasks', loadComponent: () => import('./features/student/tasks.component').then(m => m.StudentTasksComponent) },
      { path: 'results', loadComponent: () => import('./features/student/results.component').then(m => m.ResultsComponent) },
      { path: 'complaints', loadComponent: () => import('./features/student/complaints.component').then(m => m.StudentComplaintsComponent) },
      { path: 'notifications', component: NotificationsComponent },
    ]
  },

  { path: '**', redirectTo: '' }
];
