import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, FormControl, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { ChangeDetectorRef } from '@angular/core';

import { LanguageCode, LanguageService } from '../../../core/services/language.service';
import { MovimientoService } from '../../../core/services/movimiento.service';
import { AuthService } from '../../../core/services/auth.service';
import { TenantService } from '../../../core/services/tenant.service';
import { SolicitudReposicionService } from '../../../core/services/solicitud-reposicion.service';

import {
  ProductoService,
  ProductoApi,
  CategoriaApi,
  UnidadApi,
  CreateProductoRequest
} from '../../../core/services/producto.service';

import { BrandComponent } from '../../../shared/components/brand/brand.component';

@Component({
  selector: 'app-lista-productos-operador',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule, TranslateModule, BrandComponent],
  templateUrl: './lista-productos-operador.component.html',
  styleUrl: './lista-productos-operador.component.css'
})
export class ListaProductosOperadorComponent implements OnInit {
  readonly productoService = inject(ProductoService);

  private authService = inject(AuthService);
  private tenantService = inject(TenantService);
  private router = inject(Router);
  private fb = inject(FormBuilder);
  private cdr = inject(ChangeDetectorRef);
  private languageService = inject(LanguageService);
  private movimientoService = inject(MovimientoService);
  private solicitudReposicionService = inject(SolicitudReposicionService);

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
  mostrarModalSolicitud = false;

  mostrarModalEliminar = false;
  productoAEliminar: ProductoApi | null = null;

  currentLanguage: LanguageCode = this.languageService.getCurrentLanguage();
  readonly companyName = this.tenantService.getEmpresa() || '';

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

  solicitudForm = this.fb.group({
    productoId: ['', Validators.required],
    cantidadSolicitada: [1, [Validators.required, Validators.min(1)]],
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

  ngOnInit(): void {
    if (!this.companyName) {
      this.error = 'No se pudo identificar la empresa activa.';
      return;
    }

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
      const unidad = producto.unidad?.nombre ?? producto.unidad?.abreviatura ?? '';

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

  abrirModalSolicitud(): void {
    this.mostrarModalSolicitud = true;
  }

  cerrarModalSolicitud(): void {
    this.mostrarModalSolicitud = false;
    this.solicitudForm.reset({
      productoId: '',
      cantidadSolicitada: 1,
    });
  }

  crearSolicitudReposicion(): void {
  if (this.solicitudForm.invalid) {
    this.solicitudForm.markAllAsTouched();
    return;
  }

  const value = this.solicitudForm.getRawValue();

  const payload = {
    productoId: value.productoId ?? '',
    cantidadSolicitada: value.cantidadSolicitada ?? 1
  };

  this.solicitudReposicionService.crearSolicitud(payload).subscribe({
    next: () => {
      this.cerrarModalSolicitud();
      this.error = '';
      this.cdr.markForCheck();
    },
    error: () => {
      this.error = 'No se pudo registrar la solicitud de reposición.';
      this.cdr.markForCheck();
    }
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
        this.cdr.markForCheck();
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
        this.cdr.markForCheck();
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
        this.cdr.markForCheck();
      }
    });
  }

  irAEditar(producto: ProductoApi): void {
    this.router.navigate(['/productos', producto.id, 'editar']);
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
        this.cdr.markForCheck();
      }
    });
  }

  get puedeCrearProductos(): boolean {
    const role = this.authService.getRole();
    return role === 'OPERADOR' || role === 'GERENTE' || role === 'ADMIN';
  }

  get puedeEditarEliminarProductos(): boolean {
    const role = this.authService.getRole();
    return role === 'GERENTE' || role === 'ADMIN';
  }

  logout(): void {
    this.authService.logout();
    this.router.navigateByUrl('/auth/login');
  }

  irASolicitudes(): void {
  this.router.navigateByUrl('/operador/solicitudes');
}
}