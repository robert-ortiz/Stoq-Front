import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { TranslateService } from '@ngx-translate/core';
import { map, Observable, Subject, tap } from 'rxjs';
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

export type MovimientoApi = MovimientoInventario;

export interface CreateMovimientoRequest {
  productoId: string;
  tipoMovimiento: 'ENTRADA' | 'SALIDA';
  cantidad: number;
  motivo: string;
}

export interface CreateSalidaRequest {
  productoId: string;
  cantidad: number;
  motivo: string;
}

export interface CreateEntradaRequest {
  productoId: string;
  cantidad: number;
  motivo: string;
}

export interface ValidacionSalida {
  permitido: boolean;
  stockActual: number;
  cantidadSolicitada: number;
  mensaje: string;
}

@Injectable({
  providedIn: 'root'
})
export class MovimientoService {
  private http = inject(HttpClient);
  private translateService = inject(TranslateService);
  private apiUrl = `${API_BASE_URL}/api/movimientos`;
  private readonly refreshSubject = new Subject<void>();

  readonly movimientosActualizados$ = this.refreshSubject.asObservable();

  getMovimientos(): Observable<MovimientoInventario[]> {
    return this.http.get<MovimientoInventario[]>(this.apiUrl).pipe(
      map((items) => this.sortByFechaDesc(items))
    );
  }

  getMovimientosPorRango(
    requestOrInicio: MovimientoRangoRequest | string,
    maybeFin?: string
  ): Observable<MovimientoInventario[]> {
    const inicio = typeof requestOrInicio === 'string' ? requestOrInicio : requestOrInicio.inicio;
    const fin = typeof requestOrInicio === 'string' ? maybeFin ?? '' : requestOrInicio.fin;

    return this.http.get<MovimientoInventario[]>(`${this.apiUrl}/rango`, {
      params: { inicio, fin }
    }).pipe(
      map((items) => this.sortByFechaDesc(items))
    );
  }

  createMovimiento(payload: CreateMovimientoRequest): Observable<MovimientoInventario> {
    return this.http.post<MovimientoInventario>(this.apiUrl, payload).pipe(
      tap(() => this.refreshSubject.next())
    );
  }

  createSalida(payload: CreateSalidaRequest): Observable<MovimientoInventario> {
    const request: CreateMovimientoRequest = {
      ...payload,
      tipoMovimiento: 'SALIDA'
    };
    return this.createMovimiento(request);
  }

  createEntrada(payload: CreateEntradaRequest): Observable<MovimientoInventario> {
    const request: CreateMovimientoRequest = {
      ...payload,
      tipoMovimiento: 'ENTRADA'
    };
    return this.createMovimiento(request);
  }

  validarSalida(cantidad: number, stockActual: number): ValidacionSalida {
    const permitido = cantidad > 0 && cantidad <= stockActual;
    const mensaje = this.obtenerMensajeValidacion(cantidad, stockActual);
    return {
      permitido,
      stockActual,
      cantidadSolicitada: cantidad,
      mensaje
    };
  }

  private obtenerMensajeValidacion(cantidad: number, stockActual: number): string {
    if (cantidad <= 0) {
      return this.translateService.instant('STOCK_ALERT.INVALID_QUANTITY');
    }
    if (cantidad > stockActual) {
      return this.translateService.instant('STOCK_ALERT.INSUFFICIENT_STOCK_DETAIL', {
        stockActual
      });
    }
    return this.translateService.instant('STOCK_ALERT.OK_MESSAGE');
  }

  private sortByFechaDesc(items: MovimientoInventario[]): MovimientoInventario[] {
    return [...items].sort(
      (a, b) => new Date(b.fechaMovimiento).getTime() - new Date(a.fechaMovimiento).getTime()
    );
  }
}