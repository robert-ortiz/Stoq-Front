import { Injectable, inject } from '@angular/core';
import { BehaviorSubject, map, Observable, catchError, of, tap, finalize } from 'rxjs';
import { ProductosService, ProductoCritico } from './productos.service';
import { AlertaService } from './alerta.service';

export interface NotificationItem {
  id: number;
  icon: string;
  title: string;
  description: string;
  type: 'warning' | 'info' | 'success';
  timestamp: string;
  quantity?: number;
  product?: string;
}

const INITIAL_NOTIFICATIONS: NotificationItem[] = [
  {
    id: 1,
    icon: '⚠️',
    title: 'NOTIFICATIONS.LOW_STOCK',
    description: 'NOTIFICATIONS.PRODUCT_BELOW_MINIMUM',
    type: 'warning',
    timestamp: new Date().toLocaleTimeString(),
    quantity: 3,
    product: 'Producto ABC'
  },
  {
    id: 2,
    icon: '✅',
    title: 'NOTIFICATIONS.STOCK_UPDATED',
    description: 'NOTIFICATIONS.INVENTORY_MOVEMENT_COMPLETED',
    type: 'success',
    timestamp: new Date(Date.now() - 300000).toLocaleTimeString(),
    quantity: 50,
    product: 'Producto XYZ'
  },
  {
    id: 3,
    icon: 'ℹ️',
    title: 'NOTIFICATIONS.NEW_MOVEMENT',
    description: 'NOTIFICATIONS.RECENT_INVENTORY_ACTIVITY',
    type: 'info',
    timestamp: new Date(Date.now() - 600000).toLocaleTimeString()
  }
];

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  private readonly notificationsSubject = new BehaviorSubject<NotificationItem[]>(INITIAL_NOTIFICATIONS);
  private productosService = inject(ProductosService);
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

  /**
   * Refresh summary counts: unread notifications and critical products.
   * Unread count is read from AlertaService.getResumen().notificacionesSinLeer
   * Critical count is derived from ProductosService.getProductosCriticos().length
   */
  refreshAllCounts(): void {
    // refresh unread notifications
    this.alertaService.getResumen().pipe(
      catchError(() => of({ productosCriticos: 0, notificacionesSinLeer: 0, totalAlertas: 0 }))
    ).subscribe((res) => {
      this.unreadCountSubject.next(res.notificacionesSinLeer ?? 0);
    });

    // refresh critical products count
    this.productosService.getProductosCriticos().pipe(
      catchError(() => of([] as ProductoCritico[]))
    ).subscribe((items) => {
      this.criticalCountSubject.next(items?.length ?? 0);
    });
  }

  refreshCriticalAlerts(): Observable<void> {
    this.loadingSubject.next(true);
    this.errorSubject.next(null);

    return this.productosService.getProductosCriticos().pipe(
      tap((items: ProductoCritico[]) => {
        if (!items || items.length === 0) {
          this.notificationsSubject.next([]);
          return;
        }

        const mapped = items.map((p, idx) => ({
          id: idx + 1,
          icon: '⚠️',
          title: 'NOTIFICATIONS.LOW_STOCK',
          description: `${p.nombre} (${p.codigo}) - ${p.stockActual} / Mín ${p.stockMinimo}`,
          type: 'warning' as const,
          timestamp: new Date().toLocaleTimeString(),
          quantity: p.stockActual,
          product: p.nombre
        }));

        this.notificationsSubject.next(mapped);
      }),
      catchError((err) => {
        this.errorSubject.next('No se pudo cargar alertas críticas.');
        return of([] as ProductoCritico[]);
      }),
      finalize(() => this.loadingSubject.next(false)),
      map(() => void 0)
    );
  }
}