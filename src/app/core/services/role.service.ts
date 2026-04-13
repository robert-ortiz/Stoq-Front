import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_BASE_URL } from '../config/api.config';

export interface RolApi {
  id: string;
  nombre: string;
  descripcion: string;
  permisos: string[];
}

@Injectable({
  providedIn: 'root'
})
export class RoleService {
  private http = inject(HttpClient);
  private apiUrl = `${API_BASE_URL}/api/roles`;

  getRoles(): Observable<RolApi[]> {
    return this.http.get<RolApi[]>(this.apiUrl);
  }
}