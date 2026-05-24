import { ChangeDetectionStrategy, Component, DestroyRef, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { debounceTime, distinctUntilChanged, startWith } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { AuthService } from '../../../core/services/auth.service';
import { MovimientoInventario, MovimientoService } from '../../../core/services/movimiento.service';
import { ToastService } from '../../../core/services/toast.service';
import { UserService } from '../../../core/services/user.service';
import {
  calcularTotalesEntradaSalida,
  obtenerProductosConMasMovimiento
} from '../movimientos.selectors';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { BrandComponent } from '../../../shared/components/brand/brand.component';

@Component({
  selector: 'app-lista-movimientos',
  imports: [CommonModule, ReactiveFormsModule, RouterModule, TranslateModule, BrandComponent],
  templateUrl: './lista-movimientos.component.html',
  styleUrl: './lista-movimientos.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ListaMovimientosComponent implements OnInit {
  private movimientosService = inject(MovimientoService);
  private userService = inject(UserService);
  private authService = inject(AuthService);
  private toastService = inject(ToastService);
  private router = inject(Router);
  private translateService = inject(TranslateService);
  private destroyRef = inject(DestroyRef);

  readonly buscarControl = new FormControl('', { nonNullable: true });
  readonly tipoControl = new FormControl('TODOS', { nonNullable: true });
  readonly fechaInicioControl = new FormControl('', { nonNullable: true });
  readonly fechaFinControl = new FormControl('', { nonNullable: true });

  readonly esAdmin = signal(false);
  readonly verificandoPermisos = signal(true);
  readonly cargando = signal(false);
  readonly error = signal('');
  readonly tipoSeleccionado = signal('TODOS');
  readonly fechaInicioSeleccionada = signal('');
  readonly fechaFinSeleccionada = signal('');

  private readonly paginaActual = signal(1);
  readonly tamanioPagina = 10;

  private readonly movimientos = signal<MovimientoInventario[]>([]);
  private readonly busqueda = signal('');

  readonly tiposDisponibles = computed(() => {
    const tipos = new Set<string>();

    for (const item of this.movimientos()) {
      const tipo = item.tipoMovimiento.trim().toUpperCase();
      if (tipo.length > 0) {
        tipos.add(tipo);
      }
    }

    return ['TODOS', ...Array.from(tipos).sort((a, b) => a.localeCompare(b))];
  });

  readonly hayFiltrosActivos = computed(() => {
    const termino = this.busqueda().trim().length > 0;
    const tipo = this.tipoSeleccionado().trim().toUpperCase() !== 'TODOS';
    const fechaInicio = this.fechaInicioSeleccionada().trim().length > 0;
    const fechaFin = this.fechaFinSeleccionada().trim().length > 0;

    return termino || tipo || fechaInicio || fechaFin;
  });

  readonly movimientosFiltrados = computed(() => {
    const termino = this.busqueda().trim().toLowerCase();
    const tipoSeleccionado = this.tipoSeleccionado().trim().toUpperCase();
    const fechaInicio = this.fechaInicioSeleccionada().trim();
    const fechaFin = this.fechaFinSeleccionada().trim();

    const inicioMs = fechaInicio ? new Date(fechaInicio).getTime() : Number.NEGATIVE_INFINITY;
    const finMs = fechaFin ? new Date(fechaFin).getTime() : Number.POSITIVE_INFINITY;

    return this.movimientos().filter((item) => {
      const tipoItem = item.tipoMovimiento.trim().toUpperCase();
      const fechaItem = new Date(item.fechaMovimiento).getTime();

      if (tipoSeleccionado !== 'TODOS' && tipoItem !== tipoSeleccionado) {
        return false;
      }

      if (fechaItem < inicioMs || fechaItem > finMs) {
        return false;
      }

      if (!termino) {
        return true;
      }

      return (
        item.productoNombre.toLowerCase().includes(termino) ||
        item.productoCodigo.toLowerCase().includes(termino) ||
        item.usuarioNombre.toLowerCase().includes(termino) ||
        item.usuarioCorreo.toLowerCase().includes(termino) ||
        item.motivo.toLowerCase().includes(termino)
      );
    });
  });

  readonly totalPaginas = computed(() => {
    const total = Math.ceil(this.movimientosFiltrados().length / this.tamanioPagina);
    return Math.max(1, total);
  });

  readonly movimientosPaginados = computed(() => {
    const pagina = Math.min(this.paginaActual(), this.totalPaginas());
    const inicio = (pagina - 1) * this.tamanioPagina;
    const fin = inicio + this.tamanioPagina;

    return this.movimientosFiltrados().slice(inicio, fin);
  });

  readonly resumenOperativo = computed(() => {
    const actuales = this.movimientosFiltrados();

    return {
      totales: calcularTotalesEntradaSalida(actuales),
      productosTop: obtenerProductosConMasMovimiento(actuales, 3)
    };
  });

  readonly desdeRegistro = computed(() => {
    if (!this.movimientosFiltrados().length) {
      return 0;
    }

    return (this.paginaActual() - 1) * this.tamanioPagina + 1;
  });

  readonly hastaRegistro = computed(() => {
    return Math.min(this.paginaActual() * this.tamanioPagina, this.movimientosFiltrados().length);
  });

  ngOnInit(): void {
    this.buscarControl.valueChanges
      .pipe(startWith(''), debounceTime(250), distinctUntilChanged())
      .subscribe((value) => {
        this.busqueda.set(value);
        this.paginaActual.set(1);
      });

    this.tipoControl.valueChanges.pipe(startWith('TODOS')).subscribe(() => {
      this.tipoSeleccionado.set(this.tipoControl.value);
      this.paginaActual.set(1);
    });

    this.fechaInicioControl.valueChanges.pipe(startWith('')).subscribe(() => {
      this.fechaInicioSeleccionada.set(this.fechaInicioControl.value);
      this.paginaActual.set(1);
    });

    this.fechaFinControl.valueChanges.pipe(startWith('')).subscribe(() => {
      this.fechaFinSeleccionada.set(this.fechaFinControl.value);
      this.paginaActual.set(1);
    });

    this.movimientosService.movimientosActualizados$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        if (this.esAdmin()) {
          this.cargarMovimientos();
        }
      });

    this.verificarPermisosYcargar();
  }

  cargarMovimientos(): void {
    if (!this.esAdmin()) {
      return;
    }

    this.cargando.set(true);
    this.error.set('');

    const fechaInicio = this.toBackendDate(this.fechaInicioControl.value);
    const fechaFin = this.toBackendDate(this.fechaFinControl.value);

    const request$ = fechaInicio && fechaFin
      ? this.movimientosService.getMovimientosPorRango({ inicio: fechaInicio, fin: fechaFin })
      : this.movimientosService.getMovimientos();

    request$.subscribe({
      next: (items) => {
        this.movimientos.set(items);
        this.cargando.set(false);
      },
      error: () => {
        this.error.set('No se pudieron cargar los movimientos. Intenta nuevamente.');
        this.cargando.set(false);
      }
    });
  }

  aplicarFiltros(): void {
    this.paginaActual.set(1);
    this.cargarMovimientos();
  }

  limpiarFiltros(): void {
    this.buscarControl.setValue('');
    this.tipoControl.setValue('TODOS');
    this.fechaInicioControl.setValue('');
    this.fechaFinControl.setValue('');
    this.busqueda.set('');
    this.tipoSeleccionado.set('TODOS');
    this.fechaInicioSeleccionada.set('');
    this.fechaFinSeleccionada.set('');
    this.paginaActual.set(1);
    this.cargarMovimientos();
  }

  reintentar(): void {
    this.cargarMovimientos();
  }

  logout(): void {
    this.authService.logout();
    this.router.navigateByUrl('/auth/login');
  }

  paginaAnterior(): void {
    if (this.paginaActual() <= 1) {
      return;
    }

    this.paginaActual.update((current) => current - 1);
  }

  paginaSiguiente(): void {
    if (this.paginaActual() >= this.totalPaginas()) {
      return;
    }

    this.paginaActual.update((current) => current + 1);
  }

  obtenerPaginaActual(): number {
    return this.paginaActual();
  }

  trackByMovimiento(_index: number, movimiento: MovimientoInventario): string {
    return movimiento.id;
  }

  private verificarPermisosYcargar(): void {
    this.verificandoPermisos.set(true);

    this.userService.getCurrentUser().subscribe({
      next: (usuario) => {
        const esAdministrador = usuario.rol?.trim().toUpperCase() === 'ADMIN';
        this.esAdmin.set(esAdministrador);
        this.verificandoPermisos.set(false);

        if (esAdministrador) {
          this.cargarMovimientos();
          return;
        }

        this.toastService.info('No tienes permisos para consultar movimientos de inventario.');
      },
      error: () => {
        const esAdministrador = this.authService.isAdminFromToken();
        this.esAdmin.set(esAdministrador);
        this.verificandoPermisos.set(false);

        if (esAdministrador) {
          this.cargarMovimientos();
          return;
        }

        this.toastService.error('No fue posible validar tus permisos para movimientos.');
      }
    });
  }

  private toBackendDate(value: string): string | null {
    const trimmed = value.trim();
    if (!trimmed) {
      return null;
    }

    const normalized = trimmed.length === 16 ? `${trimmed}:00` : trimmed;
    const date = new Date(normalized);

    if (Number.isNaN(date.getTime())) {
      return normalized;
    }

    return date.toISOString();
  }
}