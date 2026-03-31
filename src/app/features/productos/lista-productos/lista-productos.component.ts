import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { debounceTime, distinctUntilChanged, forkJoin, startWith } from 'rxjs';
import {
  CategoriaApi,
  CreateProductoRequest,
  ProductoApi,
  ProductoService,
  UnidadApi
} from '../../../core/services/producto.service';
import { ToastService } from '../../../core/services/toast.service';

interface ProductoRow {
  id: string;
  codigo: string;
  nombre: string;
  categoria: string;
  unidad: string;
  stockActual: number;
  stockMinimo: number;
  estado: boolean;
}

@Component({
  selector: 'app-lista-productos',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './lista-productos.component.html',
  styleUrl: './lista-productos.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ListaProductosComponent implements OnInit {
  private productoService = inject(ProductoService);
  private router = inject(Router);
  private fb = inject(FormBuilder);
  private cdr = inject(ChangeDetectorRef);
  private toastService = inject(ToastService);

  readonly searchControl = new FormControl('', { nonNullable: true });
  readonly createForm = this.fb.group({
    codigo: ['', [Validators.required]],
    nombre: ['', [Validators.required, Validators.minLength(2)]],
    categoriaId: ['', [Validators.required]],
    unidadId: ['', [Validators.required]],
    stock_inicial: [0, [Validators.required, Validators.min(0)]],
    stock_minimo: [0, [Validators.required, Validators.min(0)]]
  });

  productos: ProductoRow[] = [];
  productosFiltrados: ProductoRow[] = [];
  productosPaginados: ProductoRow[] = [];
  categorias: CategoriaApi[] = [];
  unidades: UnidadApi[] = [];
  private categoriaIdsDisponibles = new Set<string>();
  private unidadIdsDisponibles = new Set<string>();

  cargando = false;
  creando = false;
  error = '';
  success = '';
  createError = '';
  mostrarCrear = false;
  mostrarModalEliminar = false;
  productoAEliminar: ProductoRow | null = null;

  paginaActual = 1;
  readonly tamanoPagina = 8;
  totalPaginas = 1;

  ngOnInit(): void {
    this.cargarDatosIniciales();

    this.searchControl.valueChanges
      .pipe(startWith(''), debounceTime(200), distinctUntilChanged())
      .subscribe(() => {
        this.paginaActual = 1;
        this.aplicarBusquedaYPaginacion();
      });
  }

  toggleCrear(): void {
    this.mostrarCrear = !this.mostrarCrear;
    this.createError = '';
    this.success = '';

    if (this.mostrarCrear) {
      this.createForm.reset({
        codigo: '',
        nombre: '',
        categoriaId: '',
        unidadId: '',
        stock_inicial: 0,
        stock_minimo: 0
      });
    }
  }

  crearProducto(): void {
    if (this.createForm.invalid) {
      this.createForm.markAllAsTouched();
      return;
    }

    this.creando = true;
    this.createError = '';
    this.success = '';

    const raw = this.createForm.getRawValue();
    const categoriaId = (raw.categoriaId ?? '').toString().trim();
    const unidadId = (raw.unidadId ?? '').toString().trim();

    if (!this.categoriaIdsDisponibles.has(categoriaId) || !this.unidadIdsDisponibles.has(unidadId)) {
      this.creando = false;
      this.createError = 'Categoria o unidad invalida. Selecciona un solo valor valido por campo.';
      this.toastService.error('Categoria/unidad invalidas o desactualizadas. Recarga e intenta de nuevo.');
      this.cdr.markForCheck();
      return;
    }

    const payload: CreateProductoRequest = {
      codigo: (raw.codigo ?? '').trim(),
      nombre: (raw.nombre ?? '').trim(),
      categoriaId,
      unidadId,
      stock_inicial: raw.stock_inicial ?? 0,
      stock_minimo: raw.stock_minimo ?? 0
    };

    console.log('Payload crear producto', payload);

    this.productoService.createProducto(payload).subscribe({
      next: () => {
        this.creando = false;
        this.success = 'Producto creado correctamente.';
        this.toastService.success('Producto creado correctamente.');
        this.mostrarCrear = false;
        this.cargarProductos();
        this.cdr.markForCheck();
      },
      error: () => {
        this.creando = false;
        this.createError = 'No se pudo crear el producto. Revisa los datos e intenta de nuevo.';
        this.toastService.error('No se pudo crear el producto.');
        this.cdr.markForCheck();
      }
    });
  }

  solicitarEliminarProducto(producto: ProductoRow): void {
    this.productoAEliminar = producto;
    this.mostrarModalEliminar = true;
  }

  cancelarEliminarProducto(): void {
    this.mostrarModalEliminar = false;
    this.productoAEliminar = null;
  }

  confirmarEliminarProducto(): void {
    if (!this.productoAEliminar) {
      return;
    }

    const producto = this.productoAEliminar;
    this.error = '';
    this.success = '';

    this.productoService.deleteProducto(producto.id).subscribe({
      next: () => {
        this.success = 'Producto eliminado correctamente.';
        this.toastService.success('Producto eliminado correctamente.');
        this.cancelarEliminarProducto();
        this.cargarProductos();
        this.cdr.markForCheck();
      },
      error: () => {
        this.error = 'No se pudo eliminar el producto.';
        this.toastService.error('No se pudo eliminar el producto.');
        this.cdr.markForCheck();
      }
    });
  }

  cargarProductos(): void {
    this.cargando = true;
    this.error = '';

    this.productoService.getProductos().subscribe({
      next: (items) => {
        this.productos = items.map((item) => this.mapearProducto(item));
        this.aplicarBusquedaYPaginacion();
        this.cargando = false;
        this.cdr.markForCheck();
      },
      error: () => {
        this.error = 'No se pudieron cargar los productos. Verifica la conexión con el backend.';
        this.toastService.error('No se pudieron cargar los productos.');
        this.cargando = false;
        this.cdr.markForCheck();
      }
    });
  }

  private cargarDatosIniciales(): void {
    this.cargando = true;
    this.error = '';

    forkJoin({
      productos: this.productoService.getProductos(),
      catalogos: this.productoService.ensureCatalogosPreestablecidos()
    }).subscribe({
      next: ({ productos, catalogos }) => {
        this.productos = productos.map((item) => this.mapearProducto(item));
        this.categorias = catalogos.categorias.filter((item) => !!item.id);
        this.unidades = catalogos.unidades.filter((item) => !!item.id);
        this.categoriaIdsDisponibles = new Set(
          this.categorias
            .map((item) => item.id)
            .filter((id): id is string => typeof id === 'string' && id.trim().length > 0)
        );
        this.unidadIdsDisponibles = new Set(
          this.unidades
            .map((item) => item.id)
            .filter((id): id is string => typeof id === 'string' && id.trim().length > 0)
        );

        if (!this.categorias.length || !this.unidades.length) {
          this.error = 'El backend no devolvio IDs validos de categoria/unidad. No se puede crear productos.';
          this.toastService.error('No hay IDs de catalogo validos para crear productos.');
        }

        this.aplicarBusquedaYPaginacion();
        this.cargando = false;
        this.cdr.markForCheck();
      },
      error: () => {
        this.error = 'No se pudieron cargar los productos. Verifica la conexión con el backend.';
        this.toastService.error('No se pudieron cargar o sincronizar productos, categorias y unidades.');
        this.cargando = false;
        this.cdr.markForCheck();
      }
    });
  }

  irAEditar(producto: ProductoRow): void {
    this.router.navigate(['/productos', producto.id, 'editar']);
  }

  paginaAnterior(): void {
    if (this.paginaActual <= 1) {
      return;
    }

    this.paginaActual -= 1;
    this.aplicarBusquedaYPaginacion();
  }

  paginaSiguiente(): void {
    if (this.paginaActual >= this.totalPaginas) {
      return;
    }

    this.paginaActual += 1;
    this.aplicarBusquedaYPaginacion();
  }

  get desdeRegistro(): number {
    if (!this.productosFiltrados.length) {
      return 0;
    }

    return (this.paginaActual - 1) * this.tamanoPagina + 1;
  }

  get hastaRegistro(): number {
    return Math.min(this.paginaActual * this.tamanoPagina, this.productosFiltrados.length);
  }

  private mapearProducto(item: ProductoApi): ProductoRow {
    return {
      id: item.id,
      codigo: item.codigo,
      nombre: item.nombre,
      categoria: item.categoria?.nombre ?? 'Sin categoria',
      unidad: item.unidad?.abreviatura ?? item.unidad?.nombre ?? 'N/A',
      stockActual: item.stockActual ?? 0,
      stockMinimo: item.stockMinimo ?? 0,
      estado: item.estado ?? true
    };
  }

  private aplicarBusquedaYPaginacion(): void {
    const termino = this.searchControl.value.trim().toLowerCase();

    this.productosFiltrados = this.productos.filter((producto) => {
      if (!termino) {
        return true;
      }

      return (
        producto.codigo.toLowerCase().includes(termino) ||
        producto.nombre.toLowerCase().includes(termino) ||
        producto.categoria.toLowerCase().includes(termino) ||
        producto.unidad.toLowerCase().includes(termino)
      );
    });

    this.totalPaginas = Math.max(1, Math.ceil(this.productosFiltrados.length / this.tamanoPagina));

    if (this.paginaActual > this.totalPaginas) {
      this.paginaActual = this.totalPaginas;
    }

    const inicio = (this.paginaActual - 1) * this.tamanoPagina;
    const fin = inicio + this.tamanoPagina;
    this.productosPaginados = this.productosFiltrados.slice(inicio, fin);

    this.cdr.markForCheck();
  }

  get codigo() {
    return this.createForm.get('codigo');
  }

  get nombre() {
    return this.createForm.get('nombre');
  }

  get categoriaId() {
    return this.createForm.get('categoriaId');
  }

  get unidadId() {
    return this.createForm.get('unidadId');
  }

  get stockMinimo() {
    return this.createForm.get('stock_minimo');
  }

  get stockInicial() {
    return this.createForm.get('stock_inicial');
  }
}
