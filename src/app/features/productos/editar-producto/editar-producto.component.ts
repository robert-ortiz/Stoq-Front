import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { forkJoin } from 'rxjs';
import { CategoriaApi, ProductoService, UnidadApi, UpdateProductoRequest } from '../../../core/services/producto.service';
import { ToastService } from '../../../core/services/toast.service';

@Component({
  selector: 'app-editar-producto',
  standalone: true,
  imports: [CommonModule, RouterModule, ReactiveFormsModule, TranslateModule],
  templateUrl: './editar-producto.component.html',
  styleUrl: './editar-producto.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class EditarProductoComponent implements OnInit {
  readonly maxLength = {
    codigo: 255,
    nombre: 255,
    ubicacion: 255
  };

  private fb = inject(FormBuilder);
  private route = inject(ActivatedRoute);
  readonly productoService = inject(ProductoService);
  private cdr = inject(ChangeDetectorRef);
  private toastService = inject(ToastService);
  private translateService = inject(TranslateService);

  readonly productoId = this.route.snapshot.paramMap.get('id');

  categorias: CategoriaApi[] = [];
  unidades: UnidadApi[] = [];
  private categoriaIdsDisponibles = new Set<string>();
  private unidadIdsDisponibles = new Set<string>();

  cargando = false;
  guardando = false;
  error = '';
  success = '';

  form = this.fb.group({
    codigo: ['', [Validators.required, Validators.maxLength(this.maxLength.codigo)]],
    nombre: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(this.maxLength.nombre)]],
    ubicacion: ['', [Validators.maxLength(this.maxLength.ubicacion)]],
    categoriaId: ['', [Validators.required]],
    unidadId: ['', [Validators.required]],
    stock_minimo: [0, [Validators.required, Validators.min(0)]],
    stock_maximo: [0, [Validators.required, Validators.min(0), Validators.max(1000000)]] // Nueva validación
  });

  ngOnInit(): void {
    if (!this.productoId) {
      this.error = this.translateService.instant('PRODUCTS.EDIT.ERROR_NO_ID');
      return;
    }

    this.cargarDatosPantalla(this.productoId);
  }

  onSubmit(): void {
    if (!this.productoId) {
      this.error = this.translateService.instant('PRODUCTS.EDIT.ERROR_NO_ID');
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
    const categoriaId = (raw.categoriaId ?? '').toString().trim();
    const unidadId = (raw.unidadId ?? '').toString().trim();

    if (!this.categoriaIdsDisponibles.has(categoriaId) || !this.unidadIdsDisponibles.has(unidadId)) {
      this.guardando = false;
      this.error = 'Categoria o unidad invalida. Selecciona un solo valor valido por campo.';
      this.toastService.error('Categoria/unidad invalidas o desactualizadas. Recarga e intenta de nuevo.');
      this.cdr.markForCheck();
      return;
    }

    const payload: UpdateProductoRequest = {
      codigo: raw.codigo?.trim(),
      nombre: raw.nombre?.trim(),
      ubicacion: raw.ubicacion?.trim(),
      categoriaId,
      unidadId,
      stock_minimo: raw.stock_minimo ?? undefined
    };

    this.productoService.updateProducto(this.productoId, payload).subscribe({
      next: () => {
        this.guardando = false;
        this.success = this.translateService.instant('PRODUCTS.EDIT.SUCCESS_UPDATE');
        this.toastService.success(this.translateService.instant('PRODUCTS.EDIT.SUCCESS_UPDATE'));
        this.cdr.markForCheck();
      },
      error: (error: HttpErrorResponse) => {
        this.guardando = false;
        this.error = this.resolveUpdateError(error);
        this.toastService.error(this.error);
        this.cdr.markForCheck();
      }
    });
  }

  private resolveUpdateError(error: HttpErrorResponse): string {
    const backendMessage = this.readBackendMessage(error?.error).toLowerCase();
    if (
      backendMessage.includes('255') ||
      backendMessage.includes('value too long') ||
      backendMessage.includes('character varying') ||
      backendMessage.includes('no puede exceder') ||
      backendMessage.includes('cannot exceed')
    ) {
      return this.translateService.instant('PRODUCTS.EDIT.FIELD_MAX_255');
    }

    if (backendMessage) {
      return this.readBackendMessage(error?.error);
    }

    return this.translateService.instant('PRODUCTS.EDIT.ERROR_UPDATE');
  }

  private readBackendMessage(payload: unknown): string {
    if (!payload) {
      return '';
    }

    if (typeof payload === 'string') {
      return payload.trim();
    }

    if (typeof payload === 'object') {
      const map = payload as Record<string, unknown>;

      if (typeof map['message'] === 'string' && map['message'].trim()) {
        return map['message'].trim();
      }

      if (typeof map['error'] === 'string' && map['error'].trim()) {
        return map['error'].trim();
      }
    }

    return '';
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
        this.categorias = categorias.filter((item) => !!item.id);
        this.unidades = unidades.filter((item) => !!item.id);
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
          this.error = 'El backend no devolvio IDs validos de categoria/unidad.';
          this.toastService.error('No hay IDs de catalogo validos para editar productos.');
        }

        this.form.patchValue({
          codigo: producto.codigo ?? '',
          nombre: producto.nombre ?? '',
          ubicacion: producto.ubicacion ?? '',
          categoriaId: producto.categoria?.id ?? '',
          unidadId: producto.unidad?.id ?? '',
          stock_minimo: producto.stockMinimo ?? 0
        });

        this.cargando = false;
        this.cdr.markForCheck();
      },
      error: () => {
        this.cargando = false;
        this.error = this.translateService.instant('PRODUCTS.EDIT.ERROR_LOAD');
        this.toastService.error(this.translateService.instant('PRODUCTS.EDIT.ERROR_LOAD'));
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
}
