import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface EditableUser {
  id: string;
  nombre: string;
  correo: string;
  empresa: string;
  estado: boolean;
  rol: string;
}

export interface UpdateUserRequest {
  nombre: string;
  correo: string;
  empresa: string;
  rol: string;
  estado?: boolean;
  contrasena?: string;
}

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private http = inject(HttpClient);
  private apiUrl = 'https://stoq-backend-2.onrender.com/api/usuarios';

  getCurrentUser(): Observable<EditableUser> {
    return this.http.get<EditableUser>(`${this.apiUrl}/me`);
  }

  getUserById(userId: string): Observable<EditableUser> {
    return this.http.get<EditableUser>(`${this.apiUrl}/${userId}`);
  }

  updateCurrentUser(payload: UpdateUserRequest): Observable<EditableUser> {
    return this.http.put<EditableUser>(`${this.apiUrl}/me`, payload);
  }

  updateUserById(userId: string, payload: UpdateUserRequest): Observable<EditableUser> {
    return this.http.put<EditableUser>(`${this.apiUrl}/${userId}`, payload);
  }

  deleteCurrentUser(): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/me`);
  }

  deleteUserById(userId: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${userId}`);
  }
}