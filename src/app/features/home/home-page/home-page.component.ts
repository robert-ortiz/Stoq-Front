import { Component, ChangeDetectionStrategy, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { AuthService } from '../../../core/services/auth.service';
import { NotificationService } from '../../../core/services/notification.service';
import { UserService } from '../../../core/services/user.service';
import { LanguageCode, LanguageService } from '../../../core/services/language.service';

interface NavigationButton {
  icon: string;
  label: string;
  route: string;
  description: string;
}

@Component({
  selector: 'app-home-page',
  standalone: true,
  imports: [CommonModule, RouterModule, TranslateModule],
  templateUrl: './home-page.component.html',
  styleUrl: './home-page.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'home-container'
  }
})
export class HomePageComponent implements OnInit {
  private authService = inject(AuthService);
  private notificationService = inject(NotificationService);
  private userService = inject(UserService);
  private router = inject(Router);
  private translateService = inject(TranslateService);
  private readonly languageService = inject(LanguageService);

  currentLanguage = this.languageService.getCurrentLanguage();
  notificationCount$ = this.notificationService.notificationCount$;

  private backendDisplayName: string | null = null;
  private backendCompany: string | null = null;
  private backendRole: string | null = null;

  ngOnInit(): void {
    this.currentLanguage = this.languageService.getCurrentLanguage();

    if (!this.isAuthenticated) {
      return;
    }

    this.userService.getCurrentUser().subscribe({
      next: (user) => {
        const normalizedRole = this.authService.syncRole(user.rol);

        this.backendDisplayName = user.nombre?.trim() || null;
        this.backendCompany = user.empresa?.trim() || null;
        this.backendRole = normalizedRole;

        this.authService.syncUserProfile({
          nombre: this.backendDisplayName,
          empresa: this.backendCompany,
          rol: this.backendRole
        });
      },
      error: () => {
        this.backendRole = this.authService.getRole();
      }
    });
  }

  get isAuthenticated(): boolean {
    return this.authService.isAuthenticated();
  }

  get displayName(): string {
    return (
      this.backendDisplayName ||
      this.authService.getDisplayName() ||
      this.translateService.instant('HOME.AUTH.DEFAULT_USER')
    );
  }

  get role(): string {
    return this.backendRole || this.authService.getRole() || 'NO_ROLE';
  }

  get roleLabel(): string {
    switch (this.role) {
      case 'ADMIN':
        return this.translateService.instant('HOME.AUTH.ROLE_ADMIN');
      case 'OPERADOR':
        return this.translateService.instant('HOME.AUTH.ROLE_OPERATOR');
      case 'GERENTE':
        return this.translateService.instant('HOME.AUTH.ROLE_MANAGER');
      default:
        return this.translateService.instant('HOME.AUTH.DEFAULT_ROLE');
    }
  }

  get company(): string {
    return (
      this.backendCompany ||
      this.authService.getCompany() ||
      this.translateService.instant('HOME.AUTH.DEFAULT_COMPANY')
    );
  }

  get isAdmin(): boolean {
    return this.role === 'ADMIN';
  }

  get isOperator(): boolean {
    return this.role === 'OPERADOR';
  }

  get isManager(): boolean {
    return this.role === 'GERENTE';
  }

  get navigationButtons(): NavigationButton[] {
    if (this.isAdmin) {
      return [
        {
          icon: '🏢',
          label: 'HOME.AUTH.USERS_AND_COMPANIES_CTA',
          route: '/admin',
          description: 'HOME.AUTH.MANAGE_USERS_AND_COMPANIES'
        },
        {
          icon: '📊',
          label: 'HOME.AUTH.MOVEMENTS_CTA',
          route: '/movimientos',
          description: 'HOME.AUTH.VIEW_MOVEMENT_HISTORY'
        }
      ];
    }

    if (this.isManager) {
      return [
        {
          icon: '📦',
          label: 'HOME.AUTH.VIEW_PRODUCTS_CTA',
          route: '/gerente',
          description: 'HOME.AUTH.MANAGE_PRODUCTS'
        },
        {
          icon: '📄',
          label: 'COMMON.REPORTS',
          route: '/reportes',
          description: 'HOME.AUTH.VIEW_ANALYTICS'
        },
        {
          icon: '🔔',
          label: 'COMMON.NOTIFICATIONS',
          route: '/notificaciones',
          description: 'HOME.AUTH.CHECK_ALERTS'
        }
      ];
    }

    if (this.isOperator) {
      return [
        {
          icon: '📦',
          label: 'HOME.AUTH.VIEW_PRODUCTS_CTA',
          route: '/operador',
          description: 'HOME.AUTH.MANAGE_PRODUCTS'
        },
        {
          icon: '↓',
          label: 'HOME.AUTH.REGISTER_ENTRY_CTA',
          route: '/entradas/registro',
          description: 'HOME.AUTH.RECORD_INCOMING'
        },
        {
          icon: '↑',
          label: 'HOME.AUTH.REGISTER_EXIT_CTA',
          route: '/salidas/registro',
          description: 'HOME.AUTH.RECORD_OUTGOING'
        },
        {
          icon: '➕',
          label: 'HOME.AUTH.ADD_PRODUCT_CTA',
          route: '/productos?create=1',
          description: 'HOME.AUTH.CREATE_NEW_PRODUCT'
        }
      ];
    }

    return [];
  }

  availableLanguages = [
    { code: 'es', flag: '🇪🇸', labelKey: 'LANGUAGE.ES' },
    { code: 'en', flag: '🇬🇧', labelKey: 'LANGUAGE.EN' },
    { code: 'pt', flag: '🇵🇹', labelKey: 'LANGUAGE.PT' }
  ];

  onLanguageChange(language: string): void {
    this.languageService.setLanguage(language as LanguageCode);
    this.currentLanguage = this.languageService.getCurrentLanguage();
  }

  navigateTo(route: string): void {
    this.router.navigateByUrl(route);
  }

  logout(): void {
    this.authService.logout();
    this.router.navigateByUrl('/auth/login');
  }
}