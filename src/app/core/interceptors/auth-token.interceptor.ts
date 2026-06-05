import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth.service';
import { TenantService } from '../services/tenant.service';

export const authTokenInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const tenantService = inject(TenantService);
  const token = authService.getToken();

  if (!token) {
    return next(req);
  }

  const headers: Record<string, string> = {
    Authorization: `Bearer ${token}`
  };

  const empresa = tenantService.getEmpresa();
  if (empresa) {
    // Add optional tenant header — backend should accept and validate it if enabled
    headers['X-EMPRESA'] = empresa;
  }

  const authReq = req.clone({ setHeaders: headers });

  return next(authReq);
};
