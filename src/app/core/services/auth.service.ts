import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface LoginRequest {
  username: string; // El formulario usa username
  password: string; // El formulario usa password
}

export interface SignupRequest {
  nombre: string;
  correo: string;
  empresa: string;
  contrasena: string;
  rol: string;
}

// Adaptado a lo que responde el LoginResponseDTO de tu backend
export interface LoginResponse {
  token: string; 
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private http = inject(HttpClient);
  // Cambiamos a la URL completa de tu servidor local
  private apiUrl = 'http://localhost:8080/api/auth';

  login(credentials: LoginRequest): Observable<LoginResponse> {
    // Transformamos los datos del Front al formato que exige el Back
    const payloadBackend = {
      correo: credentials.username,
      contrasena: credentials.password
    };
    return this.http.post<LoginResponse>(`${this.apiUrl}/login`, payloadBackend);
  }

  signup(data: SignupRequest): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${this.apiUrl}/register`, data);
  }

  logout(): void {
    // Limpiamos el token correcto
    localStorage.removeItem('token');
  }

  isAuthenticated(): boolean {
    return !!localStorage.getItem('token');
  }

  getToken(): string | null {
    return localStorage.getItem('token');
  }
}