import { AfterViewInit, ChangeDetectorRef, Component, DestroyRef, ElementRef, OnDestroy, OnInit, ViewChild, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import type { Chart, ChartConfiguration, ChartType } from 'chart.js';
import { finalize } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { AuthService } from '../../../core/services/auth.service';
import { TenantService } from '../../../core/services/tenant.service';
import { LanguageCode, LanguageService } from '../../../core/services/language.service';
import { MovimientoService } from '../../../core/services/movimiento.service';
import { ReporteDashboardResponse, ReporteService } from '../../../core/services/reporte.service';
import { ReportePdfService } from '../../../core/services/reporte-pdf.service';
import { BrandComponent } from '../../../shared/components/brand/brand.component';
import { NotificationDropdownComponent } from '../../../shared/components/notification-dropdown/notification-dropdown.component';

@Component({
  selector: 'app-reportes-dashboard',
  standalone: true,
  imports: [CommonModule, TranslateModule, BrandComponent, NotificationDropdownComponent],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit, AfterViewInit, OnDestroy {
  private authService = inject(AuthService);
  private tenantService = inject(TenantService);
  private router = inject(Router);
  private reportService = inject(ReporteService);
    private reportePdfService = inject(ReportePdfService);
  private changeDetector = inject(ChangeDetectorRef);
  private movimientoService = inject(MovimientoService);
  private languageService = inject(LanguageService);
  private destroyRef = inject(DestroyRef);

  @ViewChild('salesCanvas') salesCanvas?: ElementRef<HTMLCanvasElement>;

  private chart?: Chart;

  currentLanguage: LanguageCode = this.languageService.getCurrentLanguage();
  loading = false;
  errorMessage = '';
  reportData: ReporteDashboardResponse | null = null;

  kpis: Array<{ title: string; key: KpiKey }> = [
    { title: 'Total productos', key: 'totalProductos' },
    { title: 'Bajo stock', key: 'productosBajoStock' },
    { title: 'Entradas recientes', key: 'entradasMovimientos' },
    { title: 'Salidas recientes', key: 'salidasMovimientos' }
  ];

  topCategories: Array<{ rank: number; name: string; movimientos: number; stock: number }> = [];

  recentActivity: Array<{ who: string; what: string; when: string }> = [];

  public salesChartType: ChartType = 'line';
  public salesChartData: ChartConfiguration<'line'>['data'] = {
    labels: ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'],
    datasets: [
      {
        data: [1200, 1500, 1300, 1700, 1800, 1600, 2000],
        label: 'Ventas',
        tension: 0.3,
        borderColor: '#0F1724',
        backgroundColor: 'rgba(15,23,36,0.06)',
        pointRadius: 0
      }
    ]
  };

  public salesChartOptions: ChartConfiguration['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: {
      x: { grid: { display: false }, ticks: { color: '#6B7280' } },
      y: { grid: { color: 'rgba(15,23,36,0.04)' }, ticks: { color: '#6B7280' } }
    }
  };

  ngOnInit(): void {
    const today = new Date();
    const start = new Date();
    start.setDate(today.getDate() - 29);
    this.cargarDashboard(this.formatDate(start), this.formatDate(today));
    this.escucharActualizacionesMovimientos();
  }

  ngAfterViewInit(): void {
    this.scheduleChartRender();
  }

  ngOnDestroy(): void {
    this.chart?.destroy();
  }

  aplicarExportacionPdf(): void {
    if (!this.reportData) {
      return;
    }

    this.reportePdfService.generarDashboardPdf(this.reportData);
  }

  aplicarExportacionExcel(): void {
    if (!this.reportData) {
      return;
    }

    this.reportePdfService.generarDashboardExcel(this.reportData);
  }

  getKpiValue(key: KpiKey): number {
    return this.reportData?.[key] ?? 0;
  }

  onLanguageChange(language: string): void {
    this.languageService.setLanguage(language as LanguageCode);
    this.currentLanguage = this.languageService.getCurrentLanguage();
  }

  irAProductos(): void {
    this.router.navigateByUrl('/gerente');
  }

  logout(): void {
    this.authService.logout();
    this.router.navigateByUrl('/auth/login');
  }

  private cargarDashboard(inicio: string, fin: string): void {
    this.loading = true;
    this.errorMessage = '';

    const empresa = this.tenantService.getEmpresa();

    this.reportService
      .getReporteDashboard(inicio, fin, empresa)
      .pipe(finalize(() => (this.loading = false)))
      .subscribe({
        next: (response) => {
          this.reportData = response;
          this.topCategories = (response.categorias ?? [])
            .slice(0, 6)
            .map((item, index) => ({
              rank: index + 1,
              name: item.categoriaNombre,
              movimientos: item.movimientosTotales,
              stock: item.stockActualTotal
            }));

          this.recentActivity = (response.movimientosRecientes ?? []).map((item) => ({
            who: item.usuarioNombre ?? 'Sistema',
            what: `${item.tipoMovimiento} ${item.productoNombre ?? 'producto'}`,
            when: item.fechaMovimiento ?? ''
          }));

          this.salesChartData = {
            labels: (response.categorias ?? []).slice(0, 7).map((item) => item.categoriaNombre),
            datasets: [
              {
                data: (response.categorias ?? []).slice(0, 7).map((item) => item.movimientosTotales),
                label: 'Movimientos',
                tension: 0.3,
                borderColor: '#0F1724',
                backgroundColor: 'rgba(15,23,36,0.06)',
                pointRadius: 0
              }
            ]
          };

          this.scheduleChartRender();
        },
        error: () => {
          this.errorMessage = 'No fue posible cargar las estadísticas.';
          this.reportData = null;
          this.topCategories = [];
          this.recentActivity = [];
        }
      });
  }

  private descargarBlob(blob: Blob, filename: string): void {
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    window.URL.revokeObjectURL(url);
  }

  private formatDate(date: Date): string {
    const year = date.getFullYear();
    const month = `${date.getMonth() + 1}`.padStart(2, '0');
    const day = `${date.getDate()}`.padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  private renderChart(): void {
    const canvas = this.salesCanvas?.nativeElement;
    if (!canvas) {
      return;
    }

    this.chart?.destroy();
    // Load chart.js dynamically to avoid bundling it into the initial bundle
    // This keeps the initial payload smaller and only loads the chart library when needed
    void import('chart.js').then(({ Chart }) => {
      this.chart = new Chart(canvas, {
        type: this.salesChartType,
        data: this.salesChartData,
        options: this.salesChartOptions
      });
    });
  }

  private scheduleChartRender(): void {
    this.changeDetector.detectChanges();
    queueMicrotask(() => this.renderChart());
  }

  private escucharActualizacionesMovimientos(): void {
    this.movimientoService.movimientosActualizados$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        if (!this.reportData) {
          return;
        }

        this.cargarDashboard(this.reportData.inicio, this.reportData.fin);
      });
  }
}

type KpiKey = 'totalProductos' | 'productosBajoStock' | 'entradasMovimientos' | 'salidasMovimientos';
