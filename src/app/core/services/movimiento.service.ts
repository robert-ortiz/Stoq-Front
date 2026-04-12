import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { map, Observable } from 'rxjs';
import { API_BASE_URL } from '../config/api.config';

export interface MovimientoInventario {
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

export interface MovimientoRangoRequest {
  inicio: string;
  fin: string;
}

@Injectable({
  providedIn: 'root'
})
export class MovimientoService {
  private http = inject(HttpClient);
  private apiUrl = `${API_BASE_URL}/api/movimientos`;

  getMovimientos(): Observable<MovimientoInventario[]> {
    return this.http.get<MovimientoInventario[]>(this.apiUrl).pipe(
      map((items) => this.sortByFechaDesc(items))
    );
  }

  getMovimientosPorRango(request: MovimientoRangoRequest): Observable<MovimientoInventario[]> {
    const params = new HttpParams()
      .set('inicio', request.inicio)
      .set('fin', request.fin);

    return this.http.get<MovimientoInventario[]>(`${this.apiUrl}/rango`, { params }).pipe(
      map((items) => this.sortByFechaDesc(items))
    );
  }

  private sortByFechaDesc(items: MovimientoInventario[]): MovimientoInventario[] {
    return [...items].sort(
      (a, b) => new Date(b.fechaMovimiento).getTime() - new Date(a.fechaMovimiento).getTime()
    );
  }
}