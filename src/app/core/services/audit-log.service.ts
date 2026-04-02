import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_BASE_URL } from '../config/api.config';

export interface AuditLogApi {
  id: string;
  entidad: string;
  operacion: string;
  idRegistro: string;
  cambiosAnterior?: string | null;
  cambiosNuevo?: string | null;
  createdBy: string;
  createdDate: string;
  ipOrigen: string;
  userAgent?: string | null;
  endpoint?: string | null;
}

@Injectable({
  providedIn: 'root'
})
export class AuditLogService {
  private http = inject(HttpClient);
  private apiUrl = `${API_BASE_URL}/api/audit-logs`;

  getRecentLogs(): Observable<AuditLogApi[]> {
    return this.http.get<AuditLogApi[]>(this.apiUrl);
  }
}