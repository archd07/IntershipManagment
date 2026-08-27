import { Injectable, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AuthResponse, Role } from '../models/models';

const STORAGE_KEY = 'ims_auth';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private authState = signal<AuthResponse | null>(this.readFromStorage());

  readonly currentUser = computed(() => this.authState());
  readonly isAuthenticated = computed(() => !!this.authState());
  readonly role = computed<Role | null>(() => this.authState()?.role ?? null);

  constructor(private http: HttpClient, private router: Router) {}

  login(email: string, password: string): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${environment.apiUrl}/auth/login`, { email, password })
      .pipe(tap((res) => this.setSession(res)));
  }

  // No self-registration: student accounts are created automatically when an
  // accepted guest application is approved; supervisor accounts are created
  // by the administrator. See features/auth/apply.component.ts.

  logout(): void {
    localStorage.removeItem(STORAGE_KEY);
    this.authState.set(null);
    this.router.navigate(['/login']);
  }

  getToken(): string | null {
    return this.authState()?.token ?? null;
  }

  /** Called after a successful password change so the mandatory-change redirect stops firing. */
  clearMustChangePassword(): void {
    const current = this.authState();
    if (current) {
      this.setSession({ ...current, mustChangePassword: false });
    }
  }

  private setSession(res: AuthResponse): void {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(res));
    this.authState.set(res);
  }

  private readFromStorage(): AuthResponse | null {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  }

  /** Where to send the user right after login: forced password change first if required. */
  postLoginRoute(res: AuthResponse): string {
    return res.mustChangePassword ? '/change-password' : this.homeRouteForRole(res.role);
  }

  homeRouteForRole(role: Role): string {
    switch (role) {
      case 'ADMIN': return '/admin/dashboard';
      case 'SUPERVISOR': return '/supervisor/dashboard';
      case 'STUDENT': return '/student/dashboard';
    }
  }
}
