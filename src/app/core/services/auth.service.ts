import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export type UserRole = 'ADMINISTRADOR' | 'GERENTE' | 'OPERADOR';

export interface LoginRequest {
  correo: string;
  password: string;
}

export interface SignupRequest {
  nombre: string;
  correo: string;
  empresa?: string;
  contrasena: string;
  rol: UserRole;
}

export interface LoginResponse {
  access_token?: string;
  token?: string;
  user: {
    id: string;
    email: string;
    rol?: UserRole;
  };
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private http = inject(HttpClient);
  private apiUrl = '/api/auth';

  login(credentials: LoginRequest): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${this.apiUrl}/login`, credentials);
  }

  signup(payload: SignupRequest): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${this.apiUrl}/register`, payload);
  }

  logout(): void {
    // Clear auth data from storage
    localStorage.removeItem('access_token');
    localStorage.removeItem('user');
  }

  isAuthenticated(): boolean {
    return !!localStorage.getItem('access_token');
  }

  getToken(): string | null {
    return localStorage.getItem('access_token');
  }
}
