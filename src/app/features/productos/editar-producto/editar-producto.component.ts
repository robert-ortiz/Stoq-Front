import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { forkJoin } from 'rxjs';
import { CategoriaApi, ProductoService, UnidadApi, UpdateProductoRequest } from '../../../core/services/producto.service';
import { ToastService } from '../../../core/services/toast.service';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

@Component({
  selector: 'app-editar-producto',
  standalone: true,
  imports: [CommonModule, RouterModule, ReactiveFormsModule],
  templateUrl: './editar-producto.component.html',
  styleUrl: './editar-producto.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class EditarProductoComponent implements OnInit {
  private fb = inject(FormBuilder);
  private route = inject(ActivatedRoute);
  private productoService = inject(ProductoService);
  private cdr = inject(ChangeDetectorRef);
  private toastService = inject(ToastService);

  readonly productoId = this.route.snapshot.paramMap.get('id');

  categorias: CategoriaApi[] = [];
  unidades: UnidadApi[] = [];

  cargando = false;
  guardando = false;
  error = '';
  success = '';

  form = this.fb.group({
    codigo: ['', [Validators.required]],
    nombre: ['', [Validators.required, Validators.minLength(2)]],
    categoriaId: ['', [Validators.required]],
    unidadId: ['', [Validators.required]],
    stock_minimo: [0, [Validators.required, Validators.min(0)]]
  });

  ngOnInit(): void {
    if (!this.productoId) {
      this.error = 'No se encontro el identificador del producto.';
      return;
    }

    this.cargarDatosPantalla(this.productoId);
  }

  onSubmit(): void {
    if (!this.productoId) {
      this.error = 'No se encontro el identificador del producto.';
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
    const categoriaId = this.extractSingleId(raw.categoriaId);
    const unidadId = this.extractSingleId(raw.unidadId);

    if (!this.isValidUuid(categoriaId) || !this.isValidUuid(unidadId)) {
      this.guardando = false;
      this.error = 'Categoria y unidad deben enviarse como un unico UUID valido.';
      this.toastService.error('Revisa categoria/unidad: deben enviarse como un solo UUID.');
      this.cdr.markForCheck();
      return;
    }

    const payload: UpdateProductoRequest = {
      codigo: raw.codigo?.trim(),
      nombre: raw.nombre?.trim(),
      categoriaId,
      unidadId,
      stock_minimo: raw.stock_minimo ?? undefined
    };

    console.log('Payload editar producto', payload);

    this.productoService.updateProducto(this.productoId, payload).subscribe({
      next: () => {
        this.guardando = false;
        this.success = 'Producto actualizado correctamente.';
        this.toastService.success('Producto actualizado correctamente.');
        this.cdr.markForCheck();
      },
      error: () => {
        this.guardando = false;
        this.error = 'No se pudo actualizar el producto. Revisa los datos e intenta de nuevo.';
        this.toastService.error('No se pudo actualizar el producto.');
        this.cdr.markForCheck();
      }
    });
  }

  private cargarDatosPantalla(productoId: string): void {
    this.cargando = true;
    this.error = '';

    forkJoin({
      producto: this.productoService.getProductoById(productoId),
      categorias: this.productoService.getCategorias(),
      unidades: this.productoService.getUnidades()
    }).subscribe({
      next: ({ producto, categorias, unidades }) => {
        this.categorias = categorias;
        this.unidades = unidades;

        this.form.patchValue({
          codigo: producto.codigo ?? '',
          nombre: producto.nombre ?? '',
          categoriaId: producto.categoria?.id ?? '',
          unidadId: producto.unidad?.id ?? '',
          stock_minimo: producto.stockMinimo ?? 0
        });

        this.cargando = false;
        this.cdr.markForCheck();
      },
      error: () => {
        this.cargando = false;
        this.error = 'No se pudieron cargar los datos del producto.';
        this.toastService.error('No se pudieron cargar los datos del producto.');
        this.cdr.markForCheck();
      }
    });
  }

  get codigo() {
    return this.form.get('codigo');
  }

  get nombre() {
    return this.form.get('nombre');
  }

  get categoriaId() {
    return this.form.get('categoriaId');
  }

  get unidadId() {
    return this.form.get('unidadId');
  }

  get stockMinimo() {
    return this.form.get('stock_minimo');
  }

  private extractSingleId(value: unknown): string {
    if (typeof value === 'string') {
      return value.trim();
    }

    if (Array.isArray(value)) {
      const first = value[0];
      return typeof first === 'string' ? first.trim() : '';
    }

    if (value && typeof value === 'object' && 'id' in value) {
      const idValue = (value as { id?: unknown }).id;
      return typeof idValue === 'string' ? idValue.trim() : '';
    }

    return '';
  }

  private isValidUuid(value: string): boolean {
    return UUID_REGEX.test(value);
  }
}
