import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface ProductoApi {
  id: string;
  codigo: string;
  nombre: string;
  categoria?: {
    id?: string;
    nombre?: string;
  } | null;
  unidad?: {
    id?: string;
    nombre?: string;
    abreviatura?: string;
  } | null;
  stockActual?: number | null;
  stockMinimo?: number | null;
  estado?: boolean;
}

export interface CategoriaApi {
  id: string;
  nombre: string;
}

export interface UnidadApi {
  id: string;
  nombre: string;
  abreviatura: string;
}

export interface UpdateProductoRequest {
  codigo?: string;
  nombre?: string;
  categoriaId?: string;
  unidadId?: string;
  stock_minimo?: number;
}

export interface CreateProductoRequest {
  codigo: string;
  nombre: string;
  categoriaId: string;
  unidadId: string;
  stock_inicial: number;
  stock_minimo: number;
}

@Injectable({
  providedIn: 'root'
})
export class ProductoService {
  private http = inject(HttpClient);
  private baseUrl = 'https://stoq-backend-2.onrender.com/api';

  private apiUrl = `${this.baseUrl}/productos`;
  private categoriasUrl = `${this.baseUrl}/categorias`;
  private unidadesUrl = `${this.baseUrl}/unidades`;

  getProductos(): Observable<ProductoApi[]> {
    return this.http.get<ProductoApi[]>(this.apiUrl);
  }

  createProducto(payload: CreateProductoRequest): Observable<ProductoApi> {
    return this.http.post<ProductoApi>(this.apiUrl, payload);
  }

  getProductoById(id: string): Observable<ProductoApi> {
    return this.http.get<ProductoApi>(`${this.apiUrl}/${id}`);
  }

  updateProducto(id: string, payload: UpdateProductoRequest): Observable<ProductoApi> {
    return this.http.put<ProductoApi>(`${this.apiUrl}/${id}`, payload);
  }

  getCategorias(): Observable<CategoriaApi[]> {
    return this.http.get<CategoriaApi[]>(this.categoriasUrl);
  }

  getUnidades(): Observable<UnidadApi[]> {
    return this.http.get<UnidadApi[]>(this.unidadesUrl);
  }

  deleteProducto(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
