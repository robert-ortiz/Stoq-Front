import { Injectable } from '@angular/core';
import { BehaviorSubject, map, Observable } from 'rxjs';

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

  readonly notifications$: Observable<NotificationItem[]> = this.notificationsSubject.asObservable();

  readonly notificationCount$ = this.notifications$.pipe(map((notifications) => notifications.length));

  dismissNotification(id: number): void {
    const updatedNotifications = this.notificationsSubject.value.filter((notification) => notification.id !== id);
    this.notificationsSubject.next(updatedNotifications);
  }

  getNotificationCount(): number {
    return this.notificationsSubject.value.length;
  }
}