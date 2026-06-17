import { Injectable, inject } from '@angular/core';
import { AuthService } from './auth.service';

@Injectable({ providedIn: 'root' })
export class TenantService {
  private authService = inject(AuthService);

  /** Returns the empresa identifier (string) for the current session, or null */
  getEmpresa(): string | null {
    return this.authService.getCompany();
  }
}
