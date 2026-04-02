import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

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
  token: string;
  rol: string;
  nombre: string;
  correo: string;
}

export interface AuthSession extends LoginResponse {
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private http = inject(HttpClient);
<<<<<<< Updated upstream
  private apiUrl = 'https://stoq-backend-2.onrender.com/api/auth';
=======
  private apiUrl = `${API_BASE_URL}/api/auth`;
  private readonly storageKeys = {
    token: 'token',
    role: 'role',
    name: 'user_name',
    email: 'user_email'
  };
>>>>>>> Stashed changes
  
  login(credentials: LoginRequest): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${this.apiUrl}/login`, credentials);
  }

  signup(data: SignupRequest): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${this.apiUrl}/register`, data);
  }

  saveSession(session: LoginResponse): void {
    localStorage.setItem(this.storageKeys.token, session.token);
    localStorage.setItem(this.storageKeys.role, this.normalizeRole(session.rol) ?? '');
    localStorage.setItem(this.storageKeys.name, session.nombre ?? '');
    localStorage.setItem(this.storageKeys.email, session.correo ?? '');
  }

  logout(): void {
    localStorage.removeItem(this.storageKeys.token);
    localStorage.removeItem(this.storageKeys.role);
    localStorage.removeItem(this.storageKeys.name);
    localStorage.removeItem(this.storageKeys.email);
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

  private normalizeRole(role: string | null): string | null {
    if (!role) {
      return null;
    }

    const normalized = role.trim().toUpperCase();
    return normalized === 'USER' ? 'OPERADOR' : normalized;
  }
}