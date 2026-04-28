import { Component, OnInit, inject, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { AuthService } from '../../../core/services/auth.service';
import { LanguageCode, LanguageService } from '../../../core/services/language.service';

interface Notification {
  id: number;
  icon: string;
  title: string;
  description: string;
  type: 'warning' | 'info' | 'success';
  timestamp: string;
  quantity?: number;
  product?: string;
}

@Component({
  selector: 'app-lista-notificaciones',
  standalone: true,
  imports: [CommonModule, RouterModule, TranslateModule],
  templateUrl: './lista-notificaciones.component.html',
  styleUrl: './lista-notificaciones.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ListaNotificacionesComponent implements OnInit {
  private authService = inject(AuthService);
  private router = inject(Router);
  private translateService = inject(TranslateService);
  private languageService = inject(LanguageService);

  currentLanguage: LanguageCode = this.languageService.getCurrentLanguage();
  cargando = false;

  notifications: Notification[] = [
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

  ngOnInit(): void {
    this.currentLanguage = this.languageService.getCurrentLanguage();
  }

  onLanguageChange(language: string): void {
    this.languageService.setLanguage(language as LanguageCode);
    this.currentLanguage = this.languageService.getCurrentLanguage();
  }

  goBack(): void {
    this.router.navigateByUrl('/home');
  }

  logout(): void {
    this.authService.logout();
    this.router.navigateByUrl('/auth/login');
  }

  dismissNotification(id: number): void {
    this.notifications = this.notifications.filter(n => n.id !== id);
  }
}
