import { AfterViewInit, ChangeDetectorRef, Component, DestroyRef, ElementRef, HostListener, OnDestroy, OnInit, ViewChild, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import Chart from 'chart.js/auto';
import { finalize } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { AuthService } from '../../../core/services/auth.service';
import { TenantService } from '../../../core/services/tenant.service';
import { LanguageCode, LanguageService } from '../../../core/services/language.service';
import { NotificationService } from '../../../core/services/notification.service';
import { combineLatest, map } from 'rxjs';
import { ReporteDashboardResponse, ReporteService, RecomendacionAutomatica, SolicitudReposicion, ReporteTendenciaMovimiento } from '../../../core/services/reporte.service';
import { BrandComponent } from '../../../shared/components/brand/brand.component';

type RiskLevel = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';

interface KpiPredictivo {
  title: string;
  value: number;
  icon: string;
  riskLevel?: RiskLevel;
  unit?: string;
}

interface RisgoProducto {
  nombre: string;
  codigo: string;
  stockActual: number;
  tiempoAgotamiento: number;
  prioridad: string;
  riesgo: RiskLevel;
}

@Component({
  selector: 'app-dashboard-predictivo',
  standalone: true,
  imports: [CommonModule, TranslateModule, BrandComponent],
  templateUrl: './dashboard-predictivo.component.html',
  styleUrls: ['./dashboard-predictivo.component.css']
})
export class DashboardPredictivoComponent implements OnInit, AfterViewInit, OnDestroy {
  private authService = inject(AuthService);
  private tenantService = inject(TenantService);
  private router = inject(Router);
  private reportService = inject(ReporteService);
  private changeDetector = inject(ChangeDetectorRef);
  private languageService = inject(LanguageService);
  private notificationService = inject(NotificationService);
  private destroyRef = inject(DestroyRef);

  @ViewChild('trendChart') trendChart?: ElementRef<HTMLCanvasElement>;
  @ViewChild('riskChart') riskChart?: ElementRef<HTMLCanvasElement>;

  private trendChartInstance?: InstanceType<typeof Chart>;
  private riskChartInstance?: InstanceType<typeof Chart>;

  currentLanguage: LanguageCode = this.languageService.getCurrentLanguage();
  notificationPanelOpen = false;
  notifications$ = this.notificationService.notifications$;
  notificationCount$ = this.notificationService.notificationCount$;
  notificationLoading$ = this.notificationService.loading$;
  notificationError$ = this.notificationService.error$;
  unreadCount$ = this.notificationService.unreadCount$;
  criticalCount$ = this.notificationService.criticalCount$;
  displayUnread$ = combineLatest([this.unreadCount$, this.criticalCount$]).pipe(
    map(([unread, critical]) => (critical && critical > 0 ? 0 : unread))
  );

  loading = false;
  errorMessage = '';

  // Datos predictivos
  dashboardData: ReporteDashboardResponse | null = null;
  recomendaciones: RecomendacionAutomatica[] = [];
  solicitudes: SolicitudReposicion[] = [];
  riesgosProductos: RisgoProducto[] = [];
  tendencias: ReporteTendenciaMovimiento[] = [];

  // KPIs
  kpisPredictivos: KpiPredictivo[] = [
    { title: 'PREDICTIVE_DASHBOARD.KPI_CRITICAL_RISK', value: 0, icon: '🚨', riskLevel: 'CRITICAL' },
    { title: 'PREDICTIVE_DASHBOARD.KPI_HIGH_RISK', value: 0, icon: '⚠️', riskLevel: 'HIGH' },
    { title: 'PREDICTIVE_DASHBOARD.KPI_PENDING_REQUESTS', value: 0, icon: '📋', unit: 'solicitudes' },
    { title: 'PREDICTIVE_DASHBOARD.KPI_AVG_DEPLETION', value: 0, icon: '⏱️', unit: 'días' }
  ];

  // Gráficos
  public trendChartData = {
    labels: [] as string[],
    datasets: [
      {
        data: [] as number[],
        label: 'Saldo neto',
        tension: 0.3,
        borderColor: '#0F1724',
        backgroundColor: 'rgba(15,23,36,0.06)',
        pointRadius: 0
      }
    ]
  };

  public trendChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: {
      x: { grid: { display: false }, ticks: { color: '#6B7280' } },
      y: { grid: { color: 'rgba(15,23,36,0.04)' }, ticks: { color: '#6B7280' } }
    }
  };

  public riskChartData = {
    labels: ['Crítico', 'Alto', 'Medio', 'Bajo'],
    datasets: [
      {
        data: [0, 0, 0, 0],
        backgroundColor: ['#dc2626', '#f97316', '#eab308', '#22c55e'],
        borderColor: '#ffffff',
        borderWidth: 2
      }
    ]
  };

  public riskChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { position: 'bottom' as const } }
  };

  ngOnInit(): void {
    this.cargarDashboardPredictivo();
    this.notificationService.refreshAllCounts();
  }

  ngAfterViewInit(): void {
    this.scheduleChartRender();
  }

  ngOnDestroy(): void {
    this.trendChartInstance?.destroy();
    this.riskChartInstance?.destroy();
  }

  onLanguageChange(language: string): void {
    this.languageService.setLanguage(language as LanguageCode);
    this.currentLanguage = this.languageService.getCurrentLanguage();
  }

  irAProductos(): void {
    this.router.navigateByUrl('/gerente');
  }

  toggleNotificationPanel(): void {
    this.notificationPanelOpen = !this.notificationPanelOpen;
  }

  closeNotificationPanel(): void {
    this.notificationPanelOpen = false;
  }

  verNotificaciones(): void {
    this.toggleNotificationPanel();

    if (this.notificationPanelOpen) {
      this.notificationService.refreshCriticalAlerts().subscribe({
        next: () => {},
        error: () => {}
      });
    }
  }

  openNotificationsPage(): void {
    this.closeNotificationPanel();
    this.router.navigateByUrl('/notificaciones');
  }

  dismissNotification(id: number): void {
    this.notificationService.dismissNotification(id);
  }

  clearNotifications(): void {
    this.notificationService.clearNotifications();
  }

  logout(): void {
    this.authService.logout();
    this.router.navigateByUrl('/auth/login');
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    const target = event.target as HTMLElement | null;

    if (!target?.closest('.notification-dropdown')) {
      this.closeNotificationPanel();
    }
  }

  @HostListener('document:keydown.escape')
  onEscapeKey(): void {
    this.closeNotificationPanel();
  }

  private cargarDashboardPredictivo(): void {
    this.loading = true;
    this.errorMessage = '';

    const today = new Date();
    const start = new Date();
    start.setDate(today.getDate() - 29);

    const inicio = this.formatDate(start);
    const fin = this.formatDate(today);
    const empresa = this.tenantService.getEmpresa();

    this.reportService.getReportePredictivo(inicio, fin, empresa)
      .pipe(
        finalize(() => (this.loading = false)),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe({
        next: ({ dashboard, recomendaciones, solicitudes }) => {
          this.dashboardData = dashboard;
          this.recomendaciones = recomendaciones;
          this.solicitudes = solicitudes;
          this.tendencias = dashboard.tendencias ?? [];

          this.procesarDatosPredictivos();
          this.construirKpis();
          this.construirGraficos();
          this.changeDetector.markForCheck();
        },
        error: () => {
          this.errorMessage = 'PREDICTIVE_DASHBOARD.ERROR_LOAD';
          this.dashboardData = null;
          this.recomendaciones = [];
          this.solicitudes = [];
          this.riesgosProductos = [];
          this.changeDetector.markForCheck();
        }
      });
  }

  private procesarDatosPredictivos(): void {
    // Mapear recomendaciones a riesgos
    this.riesgosProductos = (this.recomendaciones ?? [])
      .map((rec) => ({
        nombre: rec.nombre,
        codigo: rec.codigo,
        stockActual: rec.stockActual,
        tiempoAgotamiento: rec.tiempoAgotamiento,
        prioridad: rec.prioridad,
        riesgo: this.calcularNivelRiesgo(rec.tiempoAgotamiento, rec.stockActual, rec.stockMinimo)
      }))
      .sort((a, b) => {
        const riskOrder: Record<RiskLevel, number> = { CRITICAL: 0, HIGH: 1, MEDIUM: 2, LOW: 3 };
        return riskOrder[a.riesgo] - riskOrder[b.riesgo];
      })
      .slice(0, 10); // Top 10 riesgos
  }

  private construirKpis(): void {
    // Calcular KPIs basados en recomendaciones
    const criticos = this.recomendaciones.filter((r) => r.prioridad === 'CRÍTICA').length;
    const altos = this.recomendaciones.filter((r) => r.prioridad === 'ALTA').length;
    const solicitudesPendientes = this.solicitudes.filter((s) => s.estado === 'PENDIENTE').length;
    const tiempoPromedio =
      this.recomendaciones.length > 0
        ? Math.round(
            this.recomendaciones.reduce((sum, r) => sum + r.tiempoAgotamiento, 0) /
              this.recomendaciones.length
          )
        : 0;

    this.kpisPredictivos[0].value = criticos;
    this.kpisPredictivos[1].value = altos;
    this.kpisPredictivos[2].value = solicitudesPendientes;
    this.kpisPredictivos[3].value = tiempoPromedio;
  }

  private construirGraficos(): void {
    // Gráfico de tendencias
    if (this.tendencias.length > 0) {
      this.trendChartData.labels = this.tendencias.map((t) => this.formatDateShort(t.fecha));
      this.trendChartData.datasets[0].data = this.tendencias.map((t) => t.saldoNeto);
    }

    // Gráfico de distribución de riesgos
    const criticalCount = this.riesgosProductos.filter((r) => r.riesgo === 'CRITICAL').length;
    const highCount = this.riesgosProductos.filter((r) => r.riesgo === 'HIGH').length;
    const mediumCount = this.riesgosProductos.filter((r) => r.riesgo === 'MEDIUM').length;
    const lowCount = this.riesgosProductos.filter((r) => r.riesgo === 'LOW').length;

    this.riskChartData.datasets[0].data = [criticalCount, highCount, mediumCount, lowCount];

    this.scheduleChartRender();
  }

  private calcularNivelRiesgo(tiempoAgotamiento: number, stockActual: number, stockMinimo: number): RiskLevel {
    if (stockActual === 0 || stockActual <= stockMinimo || tiempoAgotamiento <= 3) {
      return 'CRITICAL';
    }
    if (tiempoAgotamiento <= 10) {
      return 'HIGH';
    }
    if (tiempoAgotamiento <= 20) {
      return 'MEDIUM';
    }
    return 'LOW';
  }

  private formatDate(date: Date): string {
    const year = date.getFullYear();
    const month = `${date.getMonth() + 1}`.padStart(2, '0');
    const day = `${date.getDate()}`.padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  private formatDateShort(dateStr: string): string {
    const [year, month, day] = dateStr.split('-');
    return `${day}/${month}`;
  }

  private scheduleChartRender(): void {
    setTimeout(() => this.renderCharts(), 100);
  }

  private renderCharts(): void {
    this.renderTrendChart();
    this.renderRiskChart();
  }

  private renderTrendChart(): void {
    const canvas = this.trendChart?.nativeElement;
    if (!canvas) {
      return;
    }

    this.trendChartInstance?.destroy();
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      return;
    }

    this.trendChartInstance = new Chart(ctx, {
      type: 'line',
      data: this.trendChartData,
      options: this.trendChartOptions as any
    });
  }

  private renderRiskChart(): void {
    const canvas = this.riskChart?.nativeElement;
    if (!canvas) {
      return;
    }

    this.riskChartInstance?.destroy();
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      return;
    }

    this.riskChartInstance = new Chart(ctx, {
      type: 'doughnut',
      data: this.riskChartData,
      options: this.riskChartOptions as any
    });
  }
}
