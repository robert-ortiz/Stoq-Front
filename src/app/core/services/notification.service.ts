import { Injectable, inject } from '@angular/core';
import { BehaviorSubject, map, Observable, catchError, of, tap, finalize } from 'rxjs';
import { AlertaApi, AlertaService } from './alerta.service';

export type NotificationType = 'critical' | 'warning' | 'info' | 'success';

export interface NotificationVisualMeta {
  icon: string;
  labelKey: string;
}

export interface NotificationItem {
  id: number;
  icon: string;
  title: string;
  description: string;
  type: NotificationType;
  timestamp: string;
  quantity?: number;
  product?: string;
  alertId?: string;
}

export const NOTIFICATION_VISUAL_META: Record<NotificationType, NotificationVisualMeta> = {
  critical: {
    icon: '🚨',
    labelKey: 'NOTIFICATIONS.CRITICAL'
  },
  warning: {
    icon: '⚠️',
    labelKey: 'NOTIFICATIONS.WARNING'
  },
  info: {
    icon: 'ℹ️',
    labelKey: 'NOTIFICATIONS.INFO'
  },
  success: {
    icon: '✅',
    labelKey: 'NOTIFICATIONS.SUCCESS'
  }
};

export function getNotificationVisualMeta(type: NotificationType): NotificationVisualMeta {
  return NOTIFICATION_VISUAL_META[type];
}

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  private readonly notificationsSubject = new BehaviorSubject<NotificationItem[]>([]);
  private alertaService = inject(AlertaService);

  private readonly loadingSubject = new BehaviorSubject<boolean>(false);
  private readonly errorSubject = new BehaviorSubject<string | null>(null);

  readonly loading$ = this.loadingSubject.asObservable();
  readonly error$ = this.errorSubject.asObservable();
  private readonly unreadCountSubject = new BehaviorSubject<number>(0);
  private readonly criticalCountSubject = new BehaviorSubject<number>(0);

  readonly unreadCount$ = this.unreadCountSubject.asObservable();
  readonly criticalCount$ = this.criticalCountSubject.asObservable();

  readonly notifications$: Observable<NotificationItem[]> = this.notificationsSubject.asObservable();

  readonly notificationCount$ = this.notifications$.pipe(map((notifications) => notifications.length));

  clearNotifications(): void {
    this.notificationsSubject.next([]);
  }

  dismissNotification(id: number): void {
    const updatedNotifications = this.notificationsSubject.value.filter((notification) => notification.id !== id);
    this.notificationsSubject.next(updatedNotifications);
  }

  getNotificationCount(): number {
    return this.notificationsSubject.value.length;
  }

  refreshAllCounts(): void {
    this.alertaService.getResumen().pipe(
      catchError(() => of({ productosCriticos: 0, notificacionesSinLeer: 0, totalAlertas: 0 }))
    ).subscribe((res) => {
      this.unreadCountSubject.next(res.notificacionesSinLeer ?? 0);
      this.criticalCountSubject.next(res.productosCriticos ?? 0);
    });
  }

  refreshCriticalAlerts(): Observable<void> {
    this.loadingSubject.next(true);
    this.errorSubject.next(null);

    return this.alertaService.getAlertas().pipe(
      tap((alertas) => {
        this.notificationsSubject.next(this.mapAlertasToNotifications(alertas));
      }),
      catchError(() => {
        this.errorSubject.next('No se pudo cargar alertas críticas.');
        this.notificationsSubject.next([]);
        return of([] as AlertaApi[]);
      }),
      finalize(() => this.loadingSubject.next(false)),
      map(() => void 0)
    );
  }

  private mapAlertasToNotifications(alertas: AlertaApi[]): NotificationItem[] {
    return [...alertas]
      .sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime())
      .map((alerta, idx) => {
        const type = this.getAlertNotificationType(alerta);

        return {
          id: idx + 1,
          alertId: alerta.id,
          icon: getNotificationVisualMeta(type).icon,
          title: 'NOTIFICATIONS.LOW_STOCK',
          description: alerta.mensaje,
          type,
          timestamp: this.formatAlertTimestamp(alerta.fecha),
          quantity: alerta.stockActual,
          product: alerta.productoNombre
        };
      });
  }

  private getAlertNotificationType(alerta: AlertaApi): NotificationType {
    const stockActual = Number(alerta.stockActual ?? 0);
    const stockMinimo = Number(alerta.stockMinimo ?? 0);

    return stockActual < stockMinimo ? 'critical' : 'warning';
  }

  private formatAlertTimestamp(fecha: string): string {
    const parsedDate = new Date(fecha);

    if (Number.isNaN(parsedDate.getTime())) {
      return fecha;
    }

    return parsedDate.toLocaleString();
  }
}
