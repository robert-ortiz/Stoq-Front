import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_BASE_URL } from '../config/api.config';

export interface AlertaApi {
  id: string;
  tipo: string;
  mensaje: string;
  fecha: string;
  leida: boolean;
  productoId: string;
  productoCodigo: string;
  productoNombre: string;
  categoriaNombre: string;
  stockActual: number;
  stockMinimo: number;
  diferencia: number;
}

export interface AlertasResumenApi {
  productosCriticos: number;
  notificacionesSinLeer: number;
  totalAlertas: number;
}

@Injectable({
  providedIn: 'root'
})
export class AlertaService {
  private http = inject(HttpClient);
  private apiUrl = `${API_BASE_URL}/api/alertas`;

  getAlertas(): Observable<AlertaApi[]> {
    return this.http.get<AlertaApi[]>(this.apiUrl);
  }

  getResumen(): Observable<AlertasResumenApi> {
    return this.http.get<AlertasResumenApi>(`${this.apiUrl}/resumen`);
  }

  marcarComoLeida(alertaId: string): Observable<AlertaApi> {
    return this.http.put<AlertaApi>(`${this.apiUrl}/${alertaId}/marcar-leida`, {});
  }

  marcarTodasComoLeidas(): Observable<void> {
    return this.http.put<void>(`${this.apiUrl}/marcar-todas-leidas`, {});
  }
}