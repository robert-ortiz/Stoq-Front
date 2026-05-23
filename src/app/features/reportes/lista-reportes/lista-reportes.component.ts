import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnInit, inject } from '@angular/core';
import { AbstractControl, FormBuilder, ReactiveFormsModule, ValidationErrors, ValidatorFn } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { finalize } from 'rxjs';
import { AuthService } from '../../../core/services/auth.service';
import { LanguageCode, LanguageService } from '../../../core/services/language.service';
import { ReporteCategoriaResumen, ReporteCategoriasResponse, ReporteService } from '../../../core/services/reporte.service';
import { BrandComponent } from '../../../shared/components/brand/brand.component';

type ExportFormat = 'pdf' | 'excel';

@Component({
  selector: 'app-lista-reportes',
  standalone: true,
  imports: [CommonModule, RouterModule, ReactiveFormsModule, TranslateModule, BrandComponent],
  templateUrl: './lista-reportes.component.html',
  styleUrl: './lista-reportes.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ListaReportesComponent implements OnInit {
  private authService = inject(AuthService);
  private router = inject(Router);
  private translateService = inject(TranslateService);
  private languageService = inject(LanguageService);
  private reportService = inject(ReporteService);
  private fb = inject(FormBuilder);

  currentLanguage: LanguageCode = this.languageService.getCurrentLanguage();
  cargando = false;
  exportandoFormato: ExportFormat | null = null;
  errorMessage = '';
  companyContext: string | null = this.authService.getCompany();
  reporte: ReporteCategoriasResponse | null = null;
  categorias: ReporteCategoriaResumen[] = [];

  readonly filtros = this.fb.group(
    {
      inicio: [this.formatDate(this.shiftDays(new Date(), -29))],
      fin: [this.formatDate(new Date())]
    },
    { validators: [this.dateRangeValidator()] }
  );

  ngOnInit(): void {
    this.currentLanguage = this.languageService.getCurrentLanguage();
    this.cargarReporte();
  }

  onLanguageChange(language: string): void {
    this.languageService.setLanguage(language as LanguageCode);
    this.currentLanguage = this.languageService.getCurrentLanguage();
  }

  goBack(): void {
    this.router.navigateByUrl('/home');
  }

  aplicarFiltros(): void {
    if (this.filtros.invalid) {
      this.filtros.markAllAsTouched();
      return;
    }

    this.cargarReporte();
  }

  resetFilters(): void {
    this.filtros.setValue({
      inicio: this.formatDate(this.shiftDays(new Date(), -29)),
      fin: this.formatDate(new Date())
    });

    this.cargarReporte();
  }

  isRangeInvalid(): boolean {
    return this.filtros.hasError('invalidRange') && (this.filtros.touched || this.filtros.dirty);
  }

  get chartMaxValue(): number {
    return this.categorias.reduce((maxValue, item) => {
      const itemMax = Math.max(item.productosActivos, item.movimientosTotales, item.cantidadMovidaTotal);
      return Math.max(maxValue, itemMax);
    }, 1);
  }

  formatNumber(value: number | null | undefined): string {
    return new Intl.NumberFormat(this.getLocale()).format(value ?? 0);
  }

  barWidth(value: number | null | undefined): number {
    const safeValue = value ?? 0;
    return Math.max(6, (safeValue / this.chartMaxValue) * 100);
  }

  trackByCategoria(_: number, item: ReporteCategoriaResumen): string {
    return item.categoriaId ?? item.categoriaNombre;
  }

  exportarPdf(): void {
    this.exportarArchivo('pdf');
  }

  exportarExcel(): void {
    this.exportarArchivo('excel');
  }

  private cargarReporte(): void {
    const filtros = this.filtros.getRawValue();
    const inicio = filtros.inicio ?? this.formatDate(this.shiftDays(new Date(), -29));
    const fin = filtros.fin ?? this.formatDate(new Date());

    this.cargando = true;
    this.errorMessage = '';

    this.reportService
      .getReporteCategorias(inicio, fin)
      .pipe(finalize(() => (this.cargando = false)))
      .subscribe({
        next: (response) => {
          this.reporte = response;
          this.companyContext = response.empresa ?? this.authService.getCompany();
          this.categorias = [...response.categorias].sort((left, right) => {
            if (right.movimientosTotales !== left.movimientosTotales) {
              return right.movimientosTotales - left.movimientosTotales;
            }

            return left.categoriaNombre.localeCompare(right.categoriaNombre);
          });
        },
        error: () => {
          this.errorMessage = this.translateService.instant('REPORTS.ERROR_LOAD');
          this.reporte = null;
          this.categorias = [];
        }
      });
  }

  private exportarArchivo(formato: ExportFormat): void {
    const filtros = this.filtros.getRawValue();
    const inicio = filtros.inicio ?? this.formatDate(this.shiftDays(new Date(), -29));
    const fin = filtros.fin ?? this.formatDate(new Date());

    this.exportandoFormato = formato;

    const solicitud = formato === 'pdf'
      ? this.reportService.exportarPdf(inicio, fin)
      : this.reportService.exportarExcel(inicio, fin);

    solicitud.pipe(finalize(() => (this.exportandoFormato = null))).subscribe({
      next: (blob) => {
        const extension = formato === 'pdf' ? 'pdf' : 'xlsx';
        this.descargarArchivo(blob, `reporte-categorias.${extension}`);
      },
      error: () => {
        this.errorMessage = this.translateService.instant('REPORTS.ERROR_EXPORT');
      }
    });
  }

  private descargarArchivo(blob: Blob, filename: string): void {
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    window.URL.revokeObjectURL(url);
  }

  private dateRangeValidator(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      const inicio = control.get('inicio')?.value as string | null;
      const fin = control.get('fin')?.value as string | null;

      if (!inicio || !fin) {
        return null;
      }

      return inicio <= fin ? null : { invalidRange: true };
    };
  }

  private formatDate(date: Date): string {
    const year = date.getFullYear();
    const month = `${date.getMonth() + 1}`.padStart(2, '0');
    const day = `${date.getDate()}`.padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  private shiftDays(date: Date, offset: number): Date {
    const nextDate = new Date(date);
    nextDate.setDate(nextDate.getDate() + offset);
    return nextDate;
  }

  private getLocale(): string {
    switch (this.currentLanguage) {
      case 'en':
        return 'en-US';
      case 'pt':
        return 'pt-BR';
      default:
        return 'es-ES';
    }
  }

  logout(): void {
    this.authService.logout();
    this.router.navigateByUrl('/auth/login');
  }
}
