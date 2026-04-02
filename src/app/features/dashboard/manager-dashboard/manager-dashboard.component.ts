import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { forkJoin } from 'rxjs';
import { MovimientoApi, MovimientoService } from '../../../core/services/movimiento.service';
import { ProductoApi, ProductoService } from '../../../core/services/producto.service';

interface TopSalida {
  productoCodigo: string;
  productoNombre: string;
  cantidad: number;
}

@Component({
  selector: 'app-manager-dashboard',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './manager-dashboard.component.html',
  styleUrl: './manager-dashboard.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ManagerDashboardComponent implements OnInit {
  private productoService = inject(ProductoService);
  private movimientoService = inject(MovimientoService);
  private fb = inject(FormBuilder);
  private cdr = inject(ChangeDetectorRef);

  productos: ProductoApi[] = [];
  movimientos: MovimientoApi[] = [];
  movimientosFiltrados: MovimientoApi[] = [];
  loading = true;
  loadingRange = false;
  error = '';
  rangoError = '';

  form = this.fb.group({
    inicio: ['', [Validators.required]],
    fin: ['', [Validators.required]]
  });

  ngOnInit(): void {
    const fin = new Date();
    const inicio = new Date();
    inicio.setDate(fin.getDate() - 7);

    this.form.patchValue({
      inicio: this.toInputValue(inicio),
      fin: this.toInputValue(fin)
    });

    this.loadInitialData();
  }

  get stockCritico(): ProductoApi[] {
    return this.productos.filter((producto) => (producto.stockActual ?? 0) <= (producto.stockMinimo ?? 0));
  }

  get totalStockActual(): number {
    return this.productos.reduce((sum, producto) => sum + (producto.stockActual ?? 0), 0);
  }

  get totalMovimientos(): number {
    return this.movimientosFiltrados.length;
  }

  get topSalidas(): TopSalida[] {
    const acumulado = new Map<string, TopSalida>();

    this.movimientosFiltrados
      .filter((movimiento) => movimiento.tipoMovimiento === 'SALIDA')
      .forEach((movimiento) => {
        const key = movimiento.productoId;
        const current = acumulado.get(key) ?? {
          productoCodigo: movimiento.productoCodigo,
          productoNombre: movimiento.productoNombre,
          cantidad: 0
        };

        current.cantidad += movimiento.cantidad;
        acumulado.set(key, current);
      });

    return Array.from(acumulado.values())
      .sort((a, b) => b.cantidad - a.cantidad)
      .slice(0, 5);
  }

  registrarFiltro(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const raw = this.form.getRawValue();
    this.loadingRange = true;
    this.rangoError = '';

    this.movimientoService.getMovimientosPorRango(raw.inicio ?? '', raw.fin ?? '').subscribe({
      next: (movimientos) => {
        this.movimientosFiltrados = movimientos;
        this.loadingRange = false;
        this.cdr.markForCheck();
      },
      error: () => {
        this.rangoError = 'No se pudo aplicar el filtro de fechas.';
        this.loadingRange = false;
        this.cdr.markForCheck();
      }
    });
  }

  exportarCSV(): void {
    const encabezado = ['fecha,producto,tipo,cantidad,resultado,motivo'];
    const lineas = this.movimientosFiltrados.map((movimiento) => {
      const fecha = this.formatDate(movimiento.fechaMovimiento);
      const producto = `${movimiento.productoCodigo} - ${movimiento.productoNombre}`.replaceAll(',', ' ');
      const motivo = (movimiento.motivo ?? '').replaceAll(',', ' ');
      return [fecha, producto, movimiento.tipoMovimiento, movimiento.cantidad, movimiento.stockResultante, motivo].join(',');
    });

    const blob = new Blob([encabezado.concat(lineas).join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = 'reporte-inventario.csv';
    anchor.click();
    URL.revokeObjectURL(url);
  }

  private loadInitialData(): void {
    this.loading = true;
    this.error = '';

    forkJoin({
      productos: this.productoService.getProductos(),
      movimientos: this.movimientoService.getMovimientos()
    }).subscribe({
      next: ({ productos, movimientos }) => {
        this.productos = productos;
        this.movimientos = movimientos;
        this.movimientosFiltrados = movimientos;
        this.loading = false;
        this.cdr.markForCheck();
      },
      error: () => {
        this.error = 'No se pudo cargar el panel de gerente.';
        this.loading = false;
        this.cdr.markForCheck();
      }
    });
  }

  private toInputValue(date: Date): string {
    const year = date.getFullYear();
    const month = `${date.getMonth() + 1}`.padStart(2, '0');
    const day = `${date.getDate()}`.padStart(2, '0');
    const hours = `${date.getHours()}`.padStart(2, '0');
    const minutes = `${date.getMinutes()}`.padStart(2, '0');
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  }

  formatDate(value: string | null | undefined): string {
    if (!value) {
      return '-';
    }

    return new Date(value).toLocaleString('es-ES', {
      dateStyle: 'short',
      timeStyle: 'short'
    });
  }
}
