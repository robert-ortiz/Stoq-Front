import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_BASE_URL } from '../config/api.config';

export interface LoginRequest {
  correo: string;
  contrasena: string;
}

export interface SignupRequest {
  nombre: string;
  correo: string;
  empresa: string;
  contrasena: string;
  rol: string;
}

export interface LoginResponse {
  token?: string;
  rol?: string;
  role?: string;
  nombre?: string;
  name?: string;
  correo?: string;
  email?: string;
  empresa?: string;
  company?: string;
  user?: {
    token?: string;
    rol?: string;
    role?: string;
    nombre?: string;
    name?: string;
    correo?: string;
    email?: string;
    empresa?: string;
    company?: string;
  };
}

export interface AuthSession extends LoginResponse {
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private http = inject(HttpClient);
  private apiUrl = `${API_BASE_URL}/api/auth`;
  private readonly storageKeys = {
    token: 'token',
    role: 'role',
    name: 'user_name',
    email: 'user_email',
    company: 'company_name'
  };
  
  login(credentials: LoginRequest): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${this.apiUrl}/login`, credentials);
  }

  signup(data: SignupRequest): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${this.apiUrl}/register`, data);
  }

  saveSession(session: LoginResponse): void {
    const token = session.token ?? session.user?.token ?? '';
    const role = session.rol ?? session.role ?? session.user?.rol ?? session.user?.role ?? '';
    const name = session.nombre ?? session.name ?? session.user?.nombre ?? session.user?.name ?? '';
    const email = session.correo ?? session.email ?? session.user?.correo ?? session.user?.email ?? '';
    const company = session.empresa ?? session.company ?? session.user?.empresa ?? session.user?.company ?? '';

    localStorage.setItem(this.storageKeys.token, token);
    localStorage.setItem(this.storageKeys.role, this.normalizeRole(role) ?? '');
    localStorage.setItem(this.storageKeys.name, name);
    localStorage.setItem(this.storageKeys.email, email);
    localStorage.setItem(this.storageKeys.company, company);
  }

  logout(): void {
    localStorage.removeItem(this.storageKeys.token);
    localStorage.removeItem(this.storageKeys.role);
    localStorage.removeItem(this.storageKeys.name);
    localStorage.removeItem(this.storageKeys.email);
    localStorage.removeItem(this.storageKeys.company);
  }

  isAuthenticated(): boolean {
    return !!localStorage.getItem(this.storageKeys.token);
  }

  getToken(): string | null {
    return localStorage.getItem(this.storageKeys.token);
  }

  getRole(): string | null {
    return this.normalizeRole(localStorage.getItem(this.storageKeys.role));
  }

  getDisplayName(): string | null {
    return localStorage.getItem(this.storageKeys.name);
  }

  getCompany(): string | null {
    return localStorage.getItem(this.storageKeys.company);
  }

  getLandingRoute(): string {
    switch (this.getRole()) {
      case 'ADMIN':
        return '/admin';
      case 'OPERADOR':
        return '/operador';
      case 'GERENTE':
        return '/gerente';
      default:
        return '/productos';
    }
  }

  hasAnyRole(allowedRoles: string[]): boolean {
    const role = this.getRole();

    if (!role) {
      return false;
    }

    return allowedRoles.map((item) => this.normalizeRole(item)).includes(role);
  }

  private normalizeRole(role: string | null): string | null {
    if (!role) {
      return null;
    }

    const normalized = role.trim().toUpperCase();

    if (['ADMIN', 'ADMINISTRADOR', 'ADMINISTRATOR'].includes(normalized)) {
      return 'ADMIN';
    }

    if (['OPERADOR', 'OPERATOR', 'USER', 'USUARIO'].includes(normalized)) {
      return 'OPERADOR';
    }

    if (['GERENTE', 'MANAGER'].includes(normalized)) {
      return 'GERENTE';
    }

    return normalized;
  }
}