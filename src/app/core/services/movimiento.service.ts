import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { TranslateService } from '@ngx-translate/core';
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

  createSalida(payload: CreateSalidaRequest): Observable<MovimientoApi> {
    const request: CreateMovimientoRequest = {
      ...payload,
      tipoMovimiento: 'SALIDA'
    };
    return this.createMovimiento(request);
  }

  createEntrada(payload: CreateEntradaRequest): Observable<MovimientoApi> {
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
}