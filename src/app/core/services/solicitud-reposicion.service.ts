import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_BASE_URL } from '../config/api.config';

export interface CreateSolicitudReposicionRequest {
  productoId: string;
  cantidadSolicitada: number;
}

export interface SolicitudReposicionApi {
  id: string;
  productoId: string;
  productoNombre: string;
  productoCodigo: string;
  cantidadRecomendada: number;
  prioridad: string;
  estado: string;
  consumoPromedioDiario: number;
  tiempoAgotamiento: number;
  rotacion: string;
  fechaSolicitud: string;
  fechaActualizacion: string;
}

@Injectable({
  providedIn: 'root'
})
export class SolicitudReposicionService {
  private http = inject(HttpClient);
  private apiUrl = `${API_BASE_URL}/api/solicitudes`;

  getSolicitudes(): Observable<SolicitudReposicionApi[]> {
    return this.http.get<SolicitudReposicionApi[]>(this.apiUrl);
  }

  crearSolicitud(payload: CreateSolicitudReposicionRequest): Observable<SolicitudReposicionApi> {
    return this.http.post<SolicitudReposicionApi>(this.apiUrl, payload);
  }

  generarSolicitudes(): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/generar`, {});
  }

  cambiarEstado(id: string, estado: string): Observable<SolicitudReposicionApi> {
    return this.http.put<SolicitudReposicionApi>(`${this.apiUrl}/${id}/estado`, { estado });
  }
}