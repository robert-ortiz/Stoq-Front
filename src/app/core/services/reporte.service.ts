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
}

@Injectable({
  providedIn: 'root'
})
export class ReporteService {
  private http = inject(HttpClient);
  private apiUrl = `${API_BASE_URL}/api/reportes`;

  private createRangeParams(inicio: string, fin: string): HttpParams {
    return new HttpParams().set('inicio', inicio).set('fin', fin);
  }

  getReporteCategorias(inicio: string, fin: string): Observable<ReporteCategoriasResponse> {
    return this.http.get<ReporteCategoriasResponse>(`${this.apiUrl}/categorias`, {
      params: this.createRangeParams(inicio, fin)
    });
  }

  getReporteDashboard(inicio: string, fin: string): Observable<ReporteDashboardResponse> {
    return this.http.get<ReporteDashboardResponse>(`${this.apiUrl}/estadisticas`, {
      params: this.createRangeParams(inicio, fin)
    });
  }

  exportarPdf(inicio: string, fin: string): Observable<Blob> {
    return this.http.get(`${this.apiUrl}/export/pdf`, {
      params: this.createRangeParams(inicio, fin),
      responseType: 'blob'
    });
  }

  exportarExcel(inicio: string, fin: string): Observable<Blob> {
    return this.http.get(`${this.apiUrl}/export/excel`, {
      params: this.createRangeParams(inicio, fin),
      responseType: 'blob'
    });
  }
}