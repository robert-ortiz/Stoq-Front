import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';

import { AuthService } from '../../../core/services/auth.service';
import { AlertaService, AlertaApi, AlertasResumenApi } from '../../../core/services/alerta.service';

@Component({
  selector: 'app-lista-notificaciones',
  standalone: true,
  imports: [CommonModule, RouterModule, TranslatePipe],
  templateUrl: './lista-notificaciones.component.html',
  styleUrl: './lista-notificaciones.component.css'
})
export class ListaNotificacionesComponent implements OnInit {
  private alertaService = inject(AlertaService);
  private authService = inject(AuthService);
  private router = inject(Router);
  private cdr = inject(ChangeDetectorRef);

  alertas: AlertaApi[] = [];
  productosCriticos: AlertaApi[] = [];

  resumen: AlertasResumenApi = {
    productosCriticos: 0,
    notificacionesSinLeer: 0,
    totalAlertas: 0
  };

  cargando = false;
  error = '';

  ngOnInit(): void {
    this.cargarDatos();
  }

  cargarDatos(): void {
    this.cargando = true;
    this.error = '';
    this.cdr.markForCheck();

    this.alertaService.getResumen().subscribe({
      next: (resumen) => {
        this.resumen = { ...resumen };
        this.cdr.markForCheck();
      },
      error: (err) => {
        console.error('Error resumen alertas:', err);
        this.error = 'No se pudo cargar el resumen de alertas.';
        this.cdr.markForCheck();
      }
    });

    this.alertaService.getAlertas().subscribe({
      next: (alertas) => {
        this.alertas = [...alertas];

        this.productosCriticos = alertas.filter((alerta) => {
          const stockActual = Number(alerta.stockActual ?? 0);
          const stockMinimo = Number(alerta.stockMinimo ?? 0);
          return stockActual < stockMinimo;
        });

        this.cargando = false;
        this.cdr.markForCheck();
      },
      error: (err) => {
        console.error('Error alertas:', err);
        this.error = 'No se pudieron cargar las alertas.';
        this.cargando = false;
        this.cdr.markForCheck();
      }
    });
  }

  calcularPorcentajeStock(alerta: AlertaApi): number {
    const stockActual = Number(alerta.stockActual ?? 0);
    const stockMinimo = Number(alerta.stockMinimo ?? 0);

    if (stockMinimo <= 0) return 0;

    const porcentaje = (stockActual / stockMinimo) * 100;
    return Math.max(0, Math.min(100, porcentaje));
  }

  marcarComoLeida(alertaId: string): void {
    this.alertaService.marcarComoLeida(alertaId).subscribe({
      next: () => this.cargarDatos(),
      error: () => {
        this.error = 'No se pudo marcar la alerta como leída.';
        this.cdr.markForCheck();
      }
    });
  }

  marcarTodasComoLeidas(): void {
    this.alertaService.marcarTodasComoLeidas().subscribe({
      next: () => this.cargarDatos(),
      error: () => {
        this.error = 'No se pudieron marcar las alertas como leídas.';
        this.cdr.markForCheck();
      }
    });
  }

  volverAProductos(): void {
    this.router.navigateByUrl('/gerente');
  }

  irAReportes(): void {
    this.router.navigateByUrl('/reportes');
  }

  logout(): void {
    this.authService.logout();
    this.router.navigateByUrl('/auth/login');
  }
}