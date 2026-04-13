import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const roleGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);
  const allowedRoles = route.data['roles'] as string[] | undefined;

  if (authService.isAuthenticated() && (!allowedRoles || authService.hasAnyRole(allowedRoles))) {
    return true;
  }

  if (authService.isAuthenticated()) {
    return router.createUrlTree([authService.getLandingRoute()]);
  }

  return router.createUrlTree(['/auth/login'], {
    queryParams: { returnUrl: state.url }
  });
};
