import { CommonModule } from '@angular/common';
import { Component, ElementRef, HostListener, Input, OnInit, inject } from '@angular/core';
import { Router } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { combineLatest, map } from 'rxjs';

import { NotificationService, NotificationType, getNotificationVisualMeta } from '../../../core/services/notification.service';

@Component({
  selector: 'app-notification-dropdown',
  standalone: true,
  imports: [CommonModule, TranslateModule],
  templateUrl: './notification-dropdown.component.html',
  styleUrl: './notification-dropdown.component.css'
})
export class NotificationDropdownComponent implements OnInit {
  private readonly elementRef = inject(ElementRef<HTMLElement>);
  private readonly router = inject(Router);
  private readonly notificationService = inject(NotificationService);

  @Input() showCriticalBadge = true;
  @Input() criticalBadgeLabelKey = 'PREDICTIVE_DASHBOARD.CRITICAL_PRODUCTS_BADGE';

  panelOpen = false;
  notifications$ = this.notificationService.notifications$;
  notificationCount$ = this.notificationService.notificationCount$;
  loading$ = this.notificationService.loading$;
  error$ = this.notificationService.error$;
  unreadCount$ = this.notificationService.unreadCount$;
  criticalCount$ = this.notificationService.criticalCount$;
  displayUnread$ = combineLatest([this.unreadCount$, this.criticalCount$]).pipe(
    map(([unread, critical]) => (critical && critical > 0 ? 0 : unread))
  );

  ngOnInit(): void {
    this.notificationService.refreshAllCounts();
  }

  togglePanel(): void {
    this.panelOpen = !this.panelOpen;

    if (this.panelOpen) {
      this.notificationService.refreshCriticalAlerts().subscribe();
    }
  }

  closePanel(): void {
    this.panelOpen = false;
  }

  openNotificationsPage(): void {
    this.closePanel();
    this.router.navigateByUrl('/notificaciones');
  }

  dismissNotification(id: number): void {
    this.notificationService.dismissNotification(id);
  }

  clearNotifications(): void {
    this.notificationService.clearNotifications();
  }

  getTypeLabelKey(type: NotificationType): string {
    return getNotificationVisualMeta(type).labelKey;
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    const target = event.target as Node | null;

    if (target && !this.elementRef.nativeElement.contains(target)) {
      this.closePanel();
    }
  }

  @HostListener('document:keydown.escape')
  onEscapeKey(): void {
    this.closePanel();
  }
}
