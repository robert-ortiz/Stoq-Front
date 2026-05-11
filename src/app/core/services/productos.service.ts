import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_BASE_URL } from '../config/api.config';

export interface ProductoCritico {
  id: string;
  codigo: string;
  nombre: string;
  stockActual: number;
  stockMinimo: number;
  diferencia: number;
  nivelAlerta: string;
  categoriaNombre?: string;
  unidadAbreviatura?: string;
}

@Injectable({
  providedIn: 'root'
})
export class ProductosService {
  private http = inject(HttpClient);
  private readonly api = `${API_BASE_URL}/api/productos`;

  getProductosCriticos(): Observable<ProductoCritico[]> {
    return this.http.get<ProductoCritico[]>(`${this.api}/criticos`);
  }
}
