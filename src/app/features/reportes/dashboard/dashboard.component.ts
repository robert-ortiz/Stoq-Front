import { AfterViewInit, Component, ElementRef, OnDestroy, OnInit, ViewChild, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Chart, ChartConfiguration, ChartType } from 'chart.js';
import { finalize } from 'rxjs';
import { ReporteDashboardResponse, ReporteService } from '../../../core/services/reporte.service';

@Component({
  selector: 'app-reportes-dashboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit, AfterViewInit, OnDestroy {
  private reportService = inject(ReporteService);

  @ViewChild('salesCanvas') salesCanvas?: ElementRef<HTMLCanvasElement>;

  private chart?: Chart;

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
  }

  ngAfterViewInit(): void {
    this.renderChart();
  }

  ngOnDestroy(): void {
    this.chart?.destroy();
  }

  aplicarExportacionPdf(): void {
    if (!this.reportData) {
      return;
    }

    this.reportService.exportarPdf(this.reportData.inicio, this.reportData.fin).subscribe((blob) => {
      this.descargarBlob(blob, 'reporte-estadisticas.pdf');
    });
  }

  aplicarExportacionExcel(): void {
    if (!this.reportData) {
      return;
    }

    this.reportService.exportarExcel(this.reportData.inicio, this.reportData.fin).subscribe((blob) => {
      this.descargarBlob(blob, 'reporte-estadisticas.xlsx');
    });
  }

  getKpiValue(key: KpiKey): number {
    return this.reportData?.[key] ?? 0;
  }

  private cargarDashboard(inicio: string, fin: string): void {
    this.loading = true;
    this.errorMessage = '';

    this.reportService
      .getReporteDashboard(inicio, fin)
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

          this.renderChart();
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
    this.chart = new Chart(canvas, {
      type: this.salesChartType,
      data: this.salesChartData,
      options: this.salesChartOptions
    });
  }
}

type KpiKey = 'totalProductos' | 'productosBajoStock' | 'entradasMovimientos' | 'salidasMovimientos';
