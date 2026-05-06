import { Component, OnInit, inject, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { AuthService } from '../../../core/services/auth.service';
import { NotificationService } from '../../../core/services/notification.service';
import { LanguageCode, LanguageService } from '../../../core/services/language.service';

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
  private notificationService = inject(NotificationService);

  currentLanguage: LanguageCode = this.languageService.getCurrentLanguage();
  cargando = false;
  notifications$ = this.notificationService.notifications$;

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
    this.notificationService.dismissNotification(id);
  }
}
