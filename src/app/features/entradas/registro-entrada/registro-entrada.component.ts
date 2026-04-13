import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { RouterModule } from '@angular/router';
import { ProductoApi, ProductoService } from '../../../core/services/producto.service';
import { MovimientoService } from '../../../core/services/movimiento.service';
import { ToastService } from '../../../core/services/toast.service';

@Component({
  selector: 'app-registro-entrada',
  standalone: true,
  imports: [CommonModule, RouterModule, ReactiveFormsModule, TranslatePipe],
  templateUrl: './registro-entrada.component.html',
  styleUrl: './registro-entrada.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class RegistroEntradaComponent implements OnInit {
  private fb = inject(FormBuilder);
  private productoService = inject(ProductoService);
  private movimientoService = inject(MovimientoService);
  private cdr = inject(ChangeDetectorRef);
  private toastService = inject(ToastService);
  private translateService = inject(TranslateService);

  productos: ProductoApi[] = [];
  productoSeleccionado: ProductoApi | null = null;

  cargandoProductos = false;
  guardando = false;
  error = '';
  success = '';

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
        this.error = this.translateService.instant('ENTRY.REGISTER.ERROR_LOAD_PRODUCTS');
        this.cargandoProductos = false;
        this.cdr.markForCheck();
      }
    });
  }

  onProductoChange(): void {
    const productoId = this.form.get('productoId')?.value;
    this.productoSeleccionado = this.productos.find((p) => p.id === productoId) ?? null;
    this.error = '';
    this.cdr.markForCheck();
  }

  onSubmit(): void {
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

    this.movimientoService.createEntrada(payload).subscribe({
      next: () => {
        this.guardando = false;
        this.toastService.success(this.translateService.instant('ENTRY.REGISTER.SUCCESS_SAVE'));
        this.success = this.translateService.instant('ENTRY.REGISTER.SUCCESS_SAVE');
        this.form.reset();
        this.productoSeleccionado = null;
        this.cdr.markForCheck();
      },
      error: (err) => {
        console.error('Error registrando entrada:', err);
        this.guardando = false;
        const errorMsg = err?.error?.message || this.translateService.instant('ENTRY.REGISTER.ERROR_SAVE');
        this.error = errorMsg;
        this.toastService.error(errorMsg);
        this.cdr.markForCheck();
      }
    });
  }

  onCancel(): void {
    this.form.reset();
    this.productoSeleccionado = null;
    this.error = '';
    this.success = '';
    this.cdr.markForCheck();
  }
}
