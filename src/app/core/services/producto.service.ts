import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { forkJoin, map, Observable, of, switchMap } from 'rxjs';

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

interface CreateCategoriaRequest {
  nombre: string;
  descripcion: string;
}

interface CreateUnidadRequest {
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
  private apiUrl = 'http://localhost:8080/api/productos';
  private categoriasUrl = 'http://localhost:8080/api/categorias';
  private unidadesUrl = 'http://localhost:8080/api/unidades';

  private readonly categoriasPreestablecidas: CreateCategoriaRequest[] = [
    { nombre: 'Alimentos', descripcion: 'Productos alimenticios en general' },
    { nombre: 'Bebidas', descripcion: 'Bebidas y refrescos' },
    { nombre: 'Limpieza', descripcion: 'Productos de limpieza' },
    { nombre: 'Higiene', descripcion: 'Productos de cuidado personal' },
    { nombre: 'Papeleria', descripcion: 'Insumos de oficina y papeleria' }
  ];

  private readonly unidadesPreestablecidas: CreateUnidadRequest[] = [
    { nombre: 'Unidad', abreviatura: 'UND' },
    { nombre: 'Kilogramo', abreviatura: 'KG' },
    { nombre: 'Litro', abreviatura: 'LT' },
    { nombre: 'Caja', abreviatura: 'CJ' },
    { nombre: 'Paquete', abreviatura: 'PQ' }
  ];

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

  ensureCatalogosPreestablecidos(): Observable<{ categorias: CategoriaApi[]; unidades: UnidadApi[] }> {
    return forkJoin({
      categorias: this.getCategorias(),
      unidades: this.getUnidades()
    }).pipe(
      switchMap(({ categorias, unidades }) => {
        const categoriasFaltantes = this.categoriasPreestablecidas.filter(
          (preset) => !categorias.some((cat) => this.normalize(cat.nombre) === this.normalize(preset.nombre))
        );

        const unidadesFaltantes = this.unidadesPreestablecidas.filter(
          (preset) => !unidades.some((uni) => this.normalize(uni.abreviatura) === this.normalize(preset.abreviatura))
        );

        const crearCategorias$ = categoriasFaltantes.length
          ? forkJoin(categoriasFaltantes.map((item) => this.http.post<CategoriaApi>(this.categoriasUrl, item)))
          : of([]);

        const crearUnidades$ = unidadesFaltantes.length
          ? forkJoin(unidadesFaltantes.map((item) => this.http.post<UnidadApi>(this.unidadesUrl, item)))
          : of([]);

        return forkJoin({
          createdCats: crearCategorias$,
          createdUnits: crearUnidades$
        }).pipe(
          switchMap(() => forkJoin({
            categorias: this.getCategorias(),
            unidades: this.getUnidades()
          }))
        );
      })
    );
  }

  deleteProducto(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  private normalize(value: string | undefined | null): string {
    return (value ?? '').trim().toLowerCase();
  }
}