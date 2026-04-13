import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { ToastService } from '../services/toast.service';

const LAST_DENIED_KEY = 'stoq_last_denied_route';

function notifyDeniedRoute(toastService: ToastService, url: string): void {
  if (typeof sessionStorage === 'undefined') {
    toastService.info('No tienes permisos para acceder a esa seccion.');
    return;
  }

  const previousDenied = sessionStorage.getItem(LAST_DENIED_KEY);

  if (previousDenied === url) {
    return;
  }

  sessionStorage.setItem(LAST_DENIED_KEY, url);
  toastService.info('No tienes permisos para acceder a esa seccion.');
}

export const roleGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);
  const toastService = inject(ToastService);
  const allowedRoles = route.data['roles'] as string[] | undefined;

  if (authService.isAuthenticated() && (!allowedRoles || authService.hasAnyRole(allowedRoles))) {
    if (typeof sessionStorage !== 'undefined') {
      sessionStorage.removeItem(LAST_DENIED_KEY);
    }

    return true;
  }

  if (authService.isAuthenticated()) {
    notifyDeniedRoute(toastService, state.url);
    return router.createUrlTree([authService.getLandingRoute()]);
  }

  return router.createUrlTree(['/auth/login'], {
    queryParams: { returnUrl: state.url }
  });
};
