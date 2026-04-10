import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { ProductoApi, ProductoService } from '../../../core/services/producto.service';
import { MovimientoService, ValidacionSalida } from '../../../core/services/movimiento.service';
import { ToastService } from '../../../core/services/toast.service';
import { StockAlertComponent } from '../../../shared/components/stock-alert/stock-alert.component';

@Component({
  selector: 'app-registro-salida',
  standalone: true,
  imports: [CommonModule, RouterModule, ReactiveFormsModule, StockAlertComponent],
  templateUrl: './registro-salida.component.html',
  styleUrl: './registro-salida.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class RegistroSalidaComponent implements OnInit {
  private fb = inject(FormBuilder);
  private productoService = inject(ProductoService);
  private movimientoService = inject(MovimientoService);
  private cdr = inject(ChangeDetectorRef);
  private toastService = inject(ToastService);

  productos: ProductoApi[] = [];
  cargandoProductos = false;
  guardando = false;
  error = '';
  success = '';

  validacionActual: ValidacionSalida | null = null;
  productoSeleccionado: ProductoApi | null = null;

  form = this.fb.group({
    productoId: ['', [Validators.required]],
    cantidad: [0, [Validators.required, Validators.min(1)]],
    motivo: ['', [Validators.required, Validators.minLength(5)]]
  });

  ngOnInit(): void {
    this.cargarProductos();
  }

  cargarProductos(): void {
    this.cargandoProductos = true;
    this.error = '';

    this.productoService.getProductos().subscribe({
      next: (data) => {
        this.productos = data;
        this.cargandoProductos = false;
        this.cdr.markForCheck();
      },
      error: (err) => {
        console.error('Error cargando productos:', err);
        this.error = 'No se pudieron cargar los productos. Intenta más tarde.';
        this.cargandoProductos = false;
        this.cdr.markForCheck();
      }
    });
  }

  onProductoChange(): void {
    const productoId = this.form.get('productoId')?.value;
    const producto = this.productos.find((p) => p.id === productoId);

    if (producto) {
      this.productoSeleccionado = producto;
      this.form.get('cantidad')?.reset(0);
      this.validacionActual = null;
    } else {
      this.productoSeleccionado = null;
      this.validacionActual = null;
    }

    this.error = '';
    this.cdr.markForCheck();
  }

  onCantidadChange(): void {
    const cantidad = this.form.get('cantidad')?.value || 0;

    if (!this.productoSeleccionado) {
      this.validacionActual = null;
      this.cdr.markForCheck();
      return;
    }

    const stockActual = this.productoSeleccionado.stockActual || 0;
    this.validacionActual = this.movimientoService.validarSalida(cantidad, stockActual);
    this.cdr.markForCheck();
  }

  onSubmit(): void {
    if (!this.validacionActual || !this.validacionActual.permitido) {
      this.error = 'La salida no es válida. Verifica el stock disponible.';
      return;
    }

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.guardando = true;
    this.error = '';
    this.success = '';

    const raw = this.form.getRawValue();
    const payload = {
      productoId: raw.productoId!,
      cantidad: raw.cantidad!,
      motivo: raw.motivo!.trim()
    };

    this.movimientoService.createSalida(payload).subscribe({
      next: () => {
        this.guardando = false;
        this.toastService.success('Salida registrada correctamente.');
        this.form.reset();
        this.productoSeleccionado = null;
        this.validacionActual = null;
        this.success = 'Salida registrada correctamente.';
        this.cdr.markForCheck();

        // Limpiar mensajes después de 3 segundos
        setTimeout(() => {
          this.success = '';
          this.cdr.markForCheck();
        }, 3000);
      },
      error: (err) => {
        console.error('Error registrando salida:', err);
        this.guardando = false;
        const errorMsg = err?.error?.message || 'Error al registrar la salida.';
        this.error = errorMsg;
        this.toastService.error(errorMsg);
        this.cdr.markForCheck();
      }
    });
  }

  onCancel(): void {
    this.form.reset();
    this.productoSeleccionado = null;
    this.validacionActual = null;
    this.error = '';
    this.success = '';
    this.cdr.markForCheck();
  }
}
