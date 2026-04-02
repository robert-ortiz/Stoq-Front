import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_BASE_URL } from '../config/api.config';

export interface MovimientoApi {
  id: string;
  productoId: string;
  productoCodigo: string;
  productoNombre: string;
  usuarioNombre: string;
  usuarioCorreo: string;
  tipoMovimiento: string;
  cantidad: number;
  motivo: string;
  fechaMovimiento: string;
  stockAnterior: number;
  stockResultante: number;
}

export interface CreateMovimientoRequest {
  productoId: string;
  tipoMovimiento: 'ENTRADA' | 'SALIDA';
  cantidad: number;
  motivo: string;
}

@Injectable({
  providedIn: 'root'
})
export class MovimientoService {
  private http = inject(HttpClient);
  private apiUrl = `${API_BASE_URL}/api/movimientos`;

  getMovimientos(): Observable<MovimientoApi[]> {
    return this.http.get<MovimientoApi[]>(this.apiUrl);
  }

  getMovimientosPorRango(inicio: string, fin: string): Observable<MovimientoApi[]> {
    return this.http.get<MovimientoApi[]>(`${this.apiUrl}/rango`, {
      params: { inicio, fin }
    });
  }

  createMovimiento(payload: CreateMovimientoRequest): Observable<MovimientoApi> {
    return this.http.post<MovimientoApi>(this.apiUrl, payload);
  }
}