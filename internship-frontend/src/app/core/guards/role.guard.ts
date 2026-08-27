import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { Role } from '../models/models';

export const roleGuard = (allowed: Role[]): CanActivateFn => () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  const role = auth.role();

  if (!auth.isAuthenticated()) {
    router.navigate(['/login']);
    return false;
  }

  // Force the password-change screen before anything else if the account
  // still has a temporary password (newly created supervisor/student).
  if (auth.currentUser()?.mustChangePassword) {
    router.navigate(['/change-password']);
    return false;
  }

  if (role && allowed.includes(role)) return true;

  router.navigate([auth.homeRouteForRole(role!)]);
  return false;
};
