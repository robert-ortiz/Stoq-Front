import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_BASE_URL } from '../config/api.config';

export interface RecomendacionAutomaticaApi {
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

@Injectable({
  providedIn: 'root'
})
export class RecomendacionService {
  private http = inject(HttpClient);
  private apiUrl = `${API_BASE_URL}/api/recomendaciones`;

  getRecomendaciones(): Observable<RecomendacionAutomaticaApi[]> {
    return this.http.get<RecomendacionAutomaticaApi[]>(this.apiUrl);
  }
}