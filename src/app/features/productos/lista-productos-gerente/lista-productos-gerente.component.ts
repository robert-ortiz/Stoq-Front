import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, FormControl, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { ChangeDetectorRef } from '@angular/core';
import { LanguageCode, LanguageService } from '../../../core/services/language.service';
import { MovimientoService } from '../../../core/services/movimiento.service';
import { NotificationService } from '../../../core/services/notification.service';

import {
  ProductoService,
  ProductoApi,
  CategoriaApi,
  UnidadApi,
  CreateProductoRequest,
  UpdateProductoRequest
} from '../../../core/services/producto.service';

import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-lista-productos-gerente',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule, TranslateModule],
  templateUrl: './lista-productos-gerente.component.html',
  styleUrl: './lista-productos-gerente.component.css'
})
export class ListaProductosGerenteComponent implements OnInit {
  readonly productoService = inject(ProductoService);
  private authService = inject(AuthService);
  private router = inject(Router);
  private fb = inject(FormBuilder);
  private cdr = inject(ChangeDetectorRef);
  private languageService = inject(LanguageService);
  private movimientoService = inject(MovimientoService);
  private notificationService = inject(NotificationService);

  productos: ProductoApi[] = [];
  productosFiltrados: ProductoApi[] = [];
  categorias: CategoriaApi[] = [];
  unidades: UnidadApi[] = [];

  searchControl = new FormControl('');

  cargando = false;
  error = '';

  paginaActual = 1;
  registrosPorPagina = 6;

  mostrarModalEntrada = false;
  mostrarModalSalida = false;
  mostrarModalCrear = false;
  mostrarModalEditar = false;
  mostrarModalEliminar = false;

  productoAEliminar: ProductoApi | null = null;
  productoEditando: ProductoApi | null = null;

  currentLanguage: LanguageCode = this.languageService.getCurrentLanguage();
  notificationCount$ = this.notificationService.notificationCount$;

  entradaForm = this.fb.group({
    productoId: ['', Validators.required],
    cantidad: [1, [Validators.required, Validators.min(1)]],
    fecha: ['', Validators.required],
    motivo: ['']
  });

  salidaForm = this.fb.group({
    productoId: ['', Validators.required],
    cantidad: [1, [Validators.required, Validators.min(1)]],
    fecha: ['', Validators.required],
    motivo: ['']
  });

  createForm = this.fb.group({
    codigo: ['', Validators.required],
    nombre: ['', [Validators.required, Validators.minLength(2)]],
    ubicacion: [''],
    categoriaId: ['', Validators.required],
    unidadId: ['', Validators.required],
    stock_inicial: [0, [Validators.required, Validators.min(0)]],
    stock_minimo: [0, [Validators.required, Validators.min(0)]]
  });

  editForm = this.fb.group({
    codigo: ['', Validators.required],
    nombre: ['', [Validators.required, Validators.minLength(2)]],
    ubicacion: [''],
    categoriaId: ['', Validators.required],
    unidadId: ['', Validators.required],
    stock_minimo: [0, [Validators.required, Validators.min(0)]],
    estado: [true]
  });

  ngOnInit(): void {
    this.cargarDatos();

    this.searchControl.valueChanges.subscribe(() => {
      this.filtrarProductos();
    });
  }

  onLanguageChange(language: string): void {
    this.languageService.setLanguage(language as LanguageCode);
    this.currentLanguage = this.languageService.getCurrentLanguage();
  }

  cargarDatos(): void {
    this.cargando = true;
    this.error = '';
    this.cdr.markForCheck();

    this.productoService.getProductos().subscribe({
      next: (productos) => {
        this.productos = productos;
        this.productosFiltrados = productos;
        this.cargando = false;
        this.cdr.markForCheck();
      },
      error: () => {
        this.error = 'No se pudieron cargar los productos.';
        this.cargando = false;
        this.cdr.markForCheck();
      }
    });

    this.productoService.getCategorias().subscribe({
      next: (categorias) => {
        this.categorias = categorias;
        this.cdr.markForCheck();
      }
    });

    this.productoService.getUnidades().subscribe({
      next: (unidades) => {
        this.unidades = unidades;
        this.cdr.markForCheck();
      }
    });
  }

  filtrarProductos(): void {
    const query = (this.searchControl.value ?? '').toLowerCase().trim();

    this.productosFiltrados = this.productos.filter((producto) => {
      const categoria = producto.categoria?.nombre ?? '';
      const unidad = producto.unidad?.abreviatura ?? producto.unidad?.nombre ?? '';

      return (
        producto.codigo?.toLowerCase().includes(query) ||
        producto.nombre?.toLowerCase().includes(query) ||
        categoria.toLowerCase().includes(query) ||
        unidad.toLowerCase().includes(query)
      );
    });

    this.paginaActual = 1;
  }

  get productosPaginados(): ProductoApi[] {
    const inicio = (this.paginaActual - 1) * this.registrosPorPagina;
    const fin = inicio + this.registrosPorPagina;
    return this.productosFiltrados.slice(inicio, fin);
  }

  get totalPaginas(): number {
    return Math.max(1, Math.ceil(this.productosFiltrados.length / this.registrosPorPagina));
  }

  get desdeRegistro(): number {
    if (!this.productosFiltrados.length) return 0;
    return (this.paginaActual - 1) * this.registrosPorPagina + 1;
  }

  get hastaRegistro(): number {
    return Math.min(this.paginaActual * this.registrosPorPagina, this.productosFiltrados.length);
  }

  paginaAnterior(): void {
    if (this.paginaActual > 1) {
      this.paginaActual--;
    }
  }

  paginaSiguiente(): void {
    if (this.paginaActual < this.totalPaginas) {
      this.paginaActual++;
    }
  }

  abrirModalEntrada(): void {
    this.mostrarModalEntrada = true;
  }

  cerrarModalEntrada(): void {
    this.mostrarModalEntrada = false;
    this.entradaForm.reset({
      productoId: '',
      cantidad: 1,
      fecha: '',
      motivo: ''
    });
  }

  abrirModalSalida(): void {
    this.mostrarModalSalida = true;
  }

  cerrarModalSalida(): void {
    this.mostrarModalSalida = false;
    this.salidaForm.reset({
      productoId: '',
      cantidad: 1,
      fecha: '',
      motivo: ''
    });
  }

  abrirModalCrearProducto(): void {
    this.mostrarModalCrear = true;
  }

  cerrarModalCrearProducto(): void {
    this.mostrarModalCrear = false;
    this.createForm.reset({
      codigo: '',
      nombre: '',
      ubicacion: '',
      categoriaId: '',
      unidadId: '',
      stock_inicial: 0,
      stock_minimo: 0
    });
  }

  crearProducto(): void {
    if (this.createForm.invalid) {
      this.createForm.markAllAsTouched();
      return;
    }

    const value = this.createForm.getRawValue();

    const payload: CreateProductoRequest = {
      codigo: value.codigo ?? '',
      nombre: value.nombre ?? '',
      ubicacion: value.ubicacion ?? '',
      categoriaId: value.categoriaId ?? '',
      unidadId: value.unidadId ?? '',
      stock_inicial: value.stock_inicial ?? 0,
      stock_minimo: value.stock_minimo ?? 0
    };

    this.productoService.createProducto(payload).subscribe({
      next: () => {
        this.cerrarModalCrearProducto();
        this.cargarDatos();
      },
      error: () => {
        this.error = 'No se pudo crear el producto.';
      }
    });
  }

  irAEditar(producto: ProductoApi): void {
    this.productoEditando = producto;
    this.mostrarModalEditar = true;

    this.editForm.patchValue({
      codigo: producto.codigo ?? '',
      nombre: producto.nombre ?? '',
      ubicacion: producto.ubicacion ?? '',
      categoriaId: producto.categoria?.id ?? '',
      unidadId: producto.unidad?.id ?? '',
      stock_minimo: producto.stockMinimo ?? 0,
      estado: producto.estado ?? true
    });
  }

  cerrarModalEditarProducto(): void {
    this.mostrarModalEditar = false;
    this.productoEditando = null;

    this.editForm.reset({
      codigo: '',
      nombre: '',
      ubicacion: '',
      categoriaId: '',
      unidadId: '',
      stock_minimo: 0,
      estado: true
    });
  }

  guardarCambiosProducto(): void {
    if (this.editForm.invalid || !this.productoEditando?.id) {
      this.editForm.markAllAsTouched();
      return;
    }

    const value = this.editForm.getRawValue();

    const payload: UpdateProductoRequest = {
      codigo: value.codigo ?? '',
      nombre: value.nombre ?? '',
      ubicacion: value.ubicacion ?? '',
      categoriaId: value.categoriaId ?? '',
      unidadId: value.unidadId ?? '',
      stock_minimo: value.stock_minimo ?? 0
    };

    this.productoService.updateProducto(this.productoEditando.id, payload).subscribe({
      next: () => {
        this.cerrarModalEditarProducto();
        this.cargarDatos();
      },
      error: () => {
        this.error = 'No se pudo actualizar el producto.';
      }
    });
  }

  registrarEntrada(): void {
    if (this.entradaForm.invalid) {
      this.entradaForm.markAllAsTouched();
      return;
    }

    const value = this.entradaForm.getRawValue();

    const payload = {
      productoId: value.productoId ?? '',
      cantidad: value.cantidad ?? 0,
      motivo: value.motivo || 'Entrada de inventario'
    };

    this.movimientoService.createEntrada(payload).subscribe({
      next: () => {
        this.cerrarModalEntrada();
        this.cargarDatos();
      },
      error: () => {
        this.error = 'No se pudo registrar la entrada.';
      }
    });
  }

  registrarSalida(): void {
    if (this.salidaForm.invalid) {
      this.salidaForm.markAllAsTouched();
      return;
    }

    const value = this.salidaForm.getRawValue();

    const payload = {
      productoId: value.productoId ?? '',
      cantidad: value.cantidad ?? 0,
      motivo: value.motivo || 'Salida de inventario'
    };

    this.movimientoService.createSalida(payload).subscribe({
      next: () => {
        this.cerrarModalSalida();
        this.cargarDatos();
      },
      error: () => {
        this.error = 'No se pudo registrar la salida.';
      }
    });
  }

  solicitarEliminarProducto(producto: ProductoApi): void {
    this.productoAEliminar = producto;
    this.mostrarModalEliminar = true;
  }

  cancelarEliminarProducto(): void {
    this.productoAEliminar = null;
    this.mostrarModalEliminar = false;
  }

  confirmarEliminarProducto(): void {
    if (!this.productoAEliminar?.id) return;

    this.productoService.deleteProducto(this.productoAEliminar.id).subscribe({
      next: () => {
        this.cancelarEliminarProducto();
        this.cargarDatos();
      },
      error: () => {
        this.error = 'No se pudo eliminar el producto.';
      }
    });
  }

  irAReportes(): void {
    console.log('Ir a reportes');
  }

  verNotificaciones(): void {
    this.router.navigateByUrl('/notificaciones');
  }

  logout(): void {
    this.authService.logout();
    this.router.navigateByUrl('/auth/login');
  }
}