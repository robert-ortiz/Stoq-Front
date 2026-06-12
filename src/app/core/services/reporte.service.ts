import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_BASE_URL } from '../config/api.config';

export interface ReporteCategoriaResumen {
  categoriaId: string | null;
  categoriaNombre: string;
  productosActivos: number;
  stockActualTotal: number;
  stockMinimoTotal: number;
  movimientosTotales: number;
  cantidadMovidaTotal: number;
  entradasMovimientos: number;
  salidasMovimientos: number;
  entradasCantidad: number;
  salidasCantidad: number;
}

export interface ReporteCategoriasResponse {
  inicio: string;
  fin: string;
  empresa: string | null;
  totalCategorias: number;
  productosActivos: number;
  stockActualTotal: number;
  movimientosTotales: number;
  cantidadMovidaTotal: number;
  categorias: ReporteCategoriaResumen[];
}

export interface ReporteMovimientoReciente {
  id: string;
  productoId: string | null;
  productoCodigo: string | null;
  productoNombre: string | null;
  usuarioNombre: string | null;
  usuarioCorreo: string | null;
  tipoMovimiento: string;
  cantidad: number;
  motivo: string;
  fechaMovimiento: string | null;
  stockAnterior: number | null;
  stockResultante: number | null;
}

export interface ReporteTendenciaMovimiento {
  fecha: string;
  entradasMovimientos: number;
  salidasMovimientos: number;
  entradasCantidad: number;
  salidasCantidad: number;
  saldoNeto: number;
}

export interface RecomendacionAutomatica {
  productoId: string;
  codigo: string;
  nombre: string;
  stockActual: number;
  stockMinimo: number;
  consumoPromedioDiario: number;
  tiempoAgotamiento: number;
  rotacion: string;
  cantidadRecomendada: number;
  prioridad: string;
}

export interface SolicitudReposicion {
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

export interface ReporteDashboardResponse {
  inicio: string;
  fin: string;
  empresa: string | null;
  totalProductos: number;
  productosBajoStock: number;
  totalCategorias: number;
  movimientosTotales: number;
  cantidadMovidaTotal: number;
  entradasMovimientos: number;
  salidasMovimientos: number;
  entradasCantidad: number;
  salidasCantidad: number;
  categorias: ReporteCategoriaResumen[];
  movimientosRecientes: ReporteMovimientoReciente[];
  tendencias: ReporteTendenciaMovimiento[];
}

export interface DashboardPredictivoResponse {
  dashboard: ReporteDashboardResponse;
  recomendaciones: RecomendacionAutomatica[];
  solicitudes: SolicitudReposicion[];
}

@Injectable({
  providedIn: 'root'
})
export class ReporteService {
  private http = inject(HttpClient);
  private apiUrl = `${API_BASE_URL}/api/reportes`;
  private recomendacionesApiUrl = `${API_BASE_URL}/api/recomendaciones`;
  private solicitudesApiUrl = `${API_BASE_URL}/api/solicitudes`;

  private createRangeParams(inicio: string, fin: string, empresa?: string | null): HttpParams {
    let params = new HttpParams().set('inicio', inicio).set('fin', fin);

    if (empresa) {
      params = params.set('empresa', empresa);
    }

    return params;
  }

  getReporteCategorias(inicio: string, fin: string, empresa?: string | null): Observable<ReporteCategoriasResponse> {
    return this.http.get<ReporteCategoriasResponse>(`${this.apiUrl}/categorias`, {
      params: this.createRangeParams(inicio, fin, empresa)
    });
  }

  getReporteDashboard(inicio: string, fin: string, empresa?: string | null): Observable<ReporteDashboardResponse> {
    return this.http.get<ReporteDashboardResponse>(`${this.apiUrl}/estadisticas`, {
      params: this.createRangeParams(inicio, fin, empresa)
    });
  }

  getRecomendaciones(): Observable<RecomendacionAutomatica[]> {
    return this.http.get<RecomendacionAutomatica[]>(this.recomendacionesApiUrl);
  }

  getSolicitudesReposicion(): Observable<SolicitudReposicion[]> {
    return this.http.get<SolicitudReposicion[]>(this.solicitudesApiUrl);
  }

}