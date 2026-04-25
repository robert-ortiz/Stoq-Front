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
  
  login(credentials: LoginRequest): Observable<string> {
    return this.http.post(`${this.apiUrl}/login`, credentials, {
      responseType: 'text'
    });
  }

  signup(data: SignupRequest): Observable<string> {
    return this.http.post(`${this.apiUrl}/register`, data, {
      responseType: 'text'
    });
  }

  saveSession(session: LoginResponse | string): void {
    const normalizedSession = this.normalizeSession(session);
    const token = normalizedSession.token ?? '';
    const roleFromToken = this.extractRoleFromToken(token);
    const role = roleFromToken ?? normalizedSession.rol ?? normalizedSession.role ?? normalizedSession.user?.rol ?? normalizedSession.user?.role ?? '';
    const name = normalizedSession.nombre ?? normalizedSession.name ?? normalizedSession.user?.nombre ?? normalizedSession.user?.name ?? '';
    const email = normalizedSession.correo ?? normalizedSession.email ?? normalizedSession.user?.correo ?? normalizedSession.user?.email ?? '';
    const company = normalizedSession.empresa ?? normalizedSession.company ?? normalizedSession.user?.empresa ?? normalizedSession.user?.company ?? '';

    localStorage.setItem(this.storageKeys.token, token);
    localStorage.setItem(this.storageKeys.role, this.normalizeRole(role) ?? '');
    localStorage.setItem(this.storageKeys.name, name);
    localStorage.setItem(this.storageKeys.email, email);
    localStorage.setItem(this.storageKeys.company, company);
  }

  private normalizeSession(session: LoginResponse | string): LoginResponse {
    if (typeof session === 'string') {
      const token = this.extractTokenFromText(session);

      return {
        token: token ?? session.trim()
      };
    }

    return session;
  }

  private extractTokenFromText(value: string): string | null {
    const trimmed = value.trim();

    if (!trimmed) {
      return null;
    }

    try {
      const parsed = JSON.parse(trimmed) as { token?: unknown; accessToken?: unknown; jwt?: unknown };

      if (typeof parsed.token === 'string' && parsed.token.trim()) {
        return parsed.token.trim();
      }

      if (typeof parsed.accessToken === 'string' && parsed.accessToken.trim()) {
        return parsed.accessToken.trim();
      }

      if (typeof parsed.jwt === 'string' && parsed.jwt.trim()) {
        return parsed.jwt.trim();
      }
    } catch {
      return trimmed;
    }

    return trimmed;
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

  syncRole(role: string | null | undefined): string | null {
    const normalized = this.normalizeRole(role ?? null);

    if (normalized) {
      localStorage.setItem(this.storageKeys.role, normalized);
      return normalized;
    }

    localStorage.removeItem(this.storageKeys.role);
    return null;
  }

  syncUserProfile(profile: { nombre?: string | null; empresa?: string | null; rol?: string | null }): void {
    const name = (profile.nombre ?? '').trim();
    const company = (profile.empresa ?? '').trim();

    localStorage.setItem(this.storageKeys.name, name);
    localStorage.setItem(this.storageKeys.company, company);
    this.syncRole(profile.rol);
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
        return '/';
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

  getUserRoleFromToken(): string | null {
    const payload = this.getTokenPayload();
    if (!payload) {
      return null;
    }

    const role = payload['rol'] ?? payload['role'];
    if (typeof role === 'string' && role.trim().length > 0) {
      return role.trim().toUpperCase();
    }

    return null;
  }

  isAdminFromToken(): boolean {
    return this.getUserRoleFromToken() === 'ADMIN';
  }

  private getTokenPayload(): Record<string, unknown> | null {
    const token = this.getToken();
    if (!token) {
      return null;
    }

    const parts = token.split('.');
    if (parts.length !== 3) {
      return null;
    }

    try {
      const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
      const json = decodeURIComponent(
        atob(base64)
          .split('')
          .map((char) => `%${char.charCodeAt(0).toString(16).padStart(2, '0')}`)
          .join('')
      );

      const parsed = JSON.parse(json);
      return typeof parsed === 'object' && parsed !== null ? parsed as Record<string, unknown> : null;
    } catch {
      return null;
    }
  }
}