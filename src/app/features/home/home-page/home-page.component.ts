import { Component, ChangeDetectionStrategy, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { AuthService } from '../../../core/services/auth.service';
import { UserService } from '../../../core/services/user.service';

@Component({
  selector: 'app-home-page',
  standalone: true,
  imports: [CommonModule, RouterModule, TranslatePipe],
  templateUrl: './home-page.component.html',
  styleUrl: './home-page.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'home-container'
  }
})
export class HomePageComponent implements OnInit {
  private authService = inject(AuthService);
  private userService = inject(UserService);
  private router = inject(Router);
  private translateService = inject(TranslateService);

  currentLanguage = 'es';

  private backendDisplayName: string | null = null;
  private backendCompany: string | null = null;
  private backendRole: string | null = null;

  ngOnInit(): void {
    this.currentLanguage =
      this.translateService.currentLang ||
      this.translateService.defaultLang ||
      localStorage.getItem('language') ||
      'es';

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

  toggleLanguage(): void {
    const languages = ['es', 'en', 'pt'];
    const currentIndex = languages.indexOf(this.currentLanguage);
    const nextIndex = (currentIndex + 1) % languages.length;

    this.currentLanguage = languages[nextIndex];

    this.translateService.use(this.currentLanguage);
    localStorage.setItem('language', this.currentLanguage);
  }

  get nextLanguageLabel(): string {
    switch (this.currentLanguage) {
      case 'es':
        return 'EN';
      case 'en':
        return 'PT';
      case 'pt':
        return 'ES';
      default:
        return 'EN';
    }
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

  goToProductos(): void {
    this.router.navigateByUrl('/productos');
  }

  goToCrearProducto(): void {
    this.router.navigate(['/productos'], { queryParams: { create: 1 } });
  }

  goToRegistrarEntrada(): void {
    this.router.navigateByUrl('/entradas/registro');
  }

  goToMovimientos(): void {
    this.router.navigateByUrl('/movimientos');
  }

  goToRegistrarSalida(): void {
    this.router.navigateByUrl('/salidas/registro');
  }

  logout(): void {
    this.authService.logout();
    this.router.navigateByUrl('/auth/login');
  }
  availableLanguages = [
    { code: 'es', flag: '🇪🇸', labelKey: 'LANGUAGE.ES' },
    { code: 'en', flag: '🇬🇧', labelKey: 'LANGUAGE.EN' },
    { code: 'pt', flag: '🇵🇹', labelKey: 'LANGUAGE.PT' }
  ];

  onLanguageChange(language: string): void {
    this.currentLanguage = language;
    this.translateService.use(language);
    localStorage.setItem('language', language);
  }
}