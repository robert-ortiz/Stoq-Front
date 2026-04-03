import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { forkJoin } from 'rxjs';
import { AuthService } from '../../../core/services/auth.service';
import { MovimientoApi, MovimientoService } from '../../../core/services/movimiento.service';
import { ProductoApi, ProductoService } from '../../../core/services/producto.service';
import { ToastService } from '../../../core/services/toast.service';

@Component({
  selector: 'app-operador-dashboard',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './operator-dashboard.component.html',
  styleUrl: './operator-dashboard.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class OperatorDashboardComponent implements OnInit {
  private productoService = inject(ProductoService);
  private movimientoService = inject(MovimientoService);
  private toastService = inject(ToastService);
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);
  private cdr = inject(ChangeDetectorRef);

  productos: ProductoApi[] = [];
  movimientos: MovimientoApi[] = [];
  loading = true;
  saving = false;
  error = '';
  success = '';

  form = this.fb.group({
    productoId: ['', [Validators.required]],
    tipoMovimiento: ['ENTRADA', [Validators.required]],
    cantidad: [1, [Validators.required, Validators.min(1)]],
    motivo: ['', [Validators.required, Validators.minLength(3)]]
  });

  ngOnInit(): void {
    this.loadData();
  }

  get productosCriticos(): ProductoApi[] {
    return this.productos.filter((producto) => (producto.stockActual ?? 0) <= (producto.stockMinimo ?? 0));
  }

  get recientes(): MovimientoApi[] {
    return this.movimientos.slice(0, 8);
  }

  get totalMovimientos(): number {
    return this.movimientos.length;
  }

  get totalStockActual(): number {
    return this.productos.reduce((sum, producto) => sum + (producto.stockActual ?? 0), 0);
  }

  registrarMovimiento(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const raw = this.form.getRawValue();
    const productoId = raw.productoId?.trim() ?? '';
    const tipoMovimiento = raw.tipoMovimiento === 'SALIDA' ? 'SALIDA' : 'ENTRADA';
    const cantidad = raw.cantidad ?? 0;
    const motivo = raw.motivo?.trim() ?? '';

    if (!productoId) {
      return;
    }

    this.saving = true;
    this.error = '';
    this.success = '';

    this.movimientoService.createMovimiento({
      productoId,
      tipoMovimiento,
      cantidad,
      motivo
    }).subscribe({
      next: () => {
        this.saving = false;
        this.success = 'Movimiento registrado correctamente.';
        this.toastService.success('Movimiento registrado correctamente.');
        this.form.reset({
          productoId: '',
          tipoMovimiento: 'ENTRADA',
          cantidad: 1,
          motivo: ''
        });
        this.loadData();
      },
      error: () => {
        this.saving = false;
        this.error = 'No se pudo registrar el movimiento.';
        this.toastService.error('No se pudo registrar el movimiento.');
        this.cdr.markForCheck();
      }
    });
  }

  private loadData(): void {
    this.loading = true;
    this.error = '';

    forkJoin({
      productos: this.productoService.getProductos(),
      movimientos: this.movimientoService.getMovimientos()
    }).subscribe({
      next: ({ productos, movimientos }) => {
        this.productos = productos;
        this.movimientos = movimientos;
        this.loading = false;
        this.cdr.markForCheck();
      },
      error: () => {
        this.error = 'No se pudo cargar la vista del operador.';
        this.loading = false;
        this.cdr.markForCheck();
      }
    });
  }

  productoLabel(producto: ProductoApi): string {
    const ubicacion = producto.ubicacion?.trim();
    return ubicacion ? `${producto.codigo} - ${producto.nombre} (${ubicacion})` : `${producto.codigo} - ${producto.nombre}`;
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

  logout(): void {
    this.authService.logout();
    this.router.navigateByUrl('/auth/login');
  }
}
