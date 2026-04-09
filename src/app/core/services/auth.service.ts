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

interface JwtPayload {
  role?: unknown;
  rol?: unknown;
  roles?: unknown;
  authorities?: unknown;
  realm_access?: {
    roles?: unknown;
  };
  resource_access?: Record<string, {
    roles?: unknown;
  }>;
  [key: string]: unknown;
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
    const roleFromToken = this.extractRoleFromToken(token);
    const role = roleFromToken ?? session.rol ?? session.role ?? session.user?.rol ?? session.user?.role ?? '';
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
    const storedRole = this.normalizeRole(localStorage.getItem(this.storageKeys.role));

    if (storedRole) {
      return storedRole;
    }

    const token = this.getToken();

    if (!token) {
      return null;
    }

    const derivedRole = this.extractRoleFromToken(token);

    if (derivedRole) {
      localStorage.setItem(this.storageKeys.role, derivedRole);
    }

    return derivedRole;
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

  private extractRoleFromToken(token: string | null): string | null {
    if (!token) {
      return null;
    }

    const payload = this.decodeJwtPayload(token);

    if (!payload) {
      return null;
    }

    const candidates: unknown[] = [
      payload.role,
      payload.rol,
      payload.roles,
      payload.authorities,
      payload.realm_access?.roles
    ];

    if (payload.resource_access && typeof payload.resource_access === 'object') {
      for (const entry of Object.values(payload.resource_access)) {
        candidates.push(entry?.roles);
      }
    }

    for (const candidate of candidates) {
      const role = this.normalizeRole(this.readRoleValue(candidate));

      if (role) {
        return role;
      }
    }

    return null;
  }

  private readRoleValue(value: unknown): string | null {
    if (typeof value === 'string') {
      return value;
    }

    if (Array.isArray(value)) {
      for (const item of value) {
        const nested = this.readRoleValue(item);

        if (nested) {
          return nested;
        }
      }

      return null;
    }

    if (value && typeof value === 'object') {
      const record = value as Record<string, unknown>;

      return (
        this.readRoleValue(record['role']) ??
        this.readRoleValue(record['rol']) ??
        this.readRoleValue(record['authority']) ??
        this.readRoleValue(record['name']) ??
        this.readRoleValue(record['roles'])
      );
    }

    return null;
  }

  private decodeJwtPayload(token: string): JwtPayload | null {
    const parts = token.split('.');

    if (parts.length < 2) {
      return null;
    }

    try {
      const payload = parts[1].replace(/-/g, '+').replace(/_/g, '/');
      const paddedPayload = payload.padEnd(payload.length + ((4 - (payload.length % 4)) % 4), '=');

      return JSON.parse(atob(paddedPayload)) as JwtPayload;
    } catch {
      return null;
    }
  }

  private normalizeRole(role: string | null): string | null {
    if (!role) {
      return null;
    }

    const normalized = role.trim().toUpperCase().replace(/^ROLE_/, '');

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