import { DOCUMENT } from '@angular/common';
import { Component, ChangeDetectionStrategy, OnDestroy, OnInit, PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Router, RouterOutlet, NavigationEnd } from '@angular/router';
import { filter, Subscription } from 'rxjs';
import { ToastContainerComponent } from './shared/components/toast-container/toast-container.component';
import { AuthService } from './core/services/auth.service';
import { LanguageCode, LanguageService } from './core/services/language.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, ToastContainerComponent],
  templateUrl: './app.html',
  styleUrl: './app.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class App implements OnInit, OnDestroy {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly languageService = inject(LanguageService);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly document = inject(DOCUMENT);
  private get body(): HTMLElement | null {
    return isPlatformBrowser(this.platformId) ? this.document.body : null;
  }
  private routerSubscription?: Subscription;

  themeClass = 'theme-default';
  currentLanguage: LanguageCode = this.languageService.getCurrentLanguage();
  readonly availableLanguages = this.languageService.supportedLanguages;

  ngOnInit(): void {
    this.languageService.initLanguage();
    this.currentLanguage = this.languageService.getCurrentLanguage();
    this.syncThemeClass();

    this.routerSubscription = this.router.events
      .pipe(filter((event) => event instanceof NavigationEnd))
      .subscribe(() => {
        this.syncThemeClass();
      });
  }

  ngOnDestroy(): void {
    this.routerSubscription?.unsubscribe();
    this.removeThemeClasses();
  }

  onLanguageChange(language: string): void {
    this.languageService.setLanguage(language as LanguageCode);
    this.currentLanguage = this.languageService.getCurrentLanguage();
  }

  private syncThemeClass(): void {
    const role = this.authService.getRole();
    const nextThemeClass = this.mapRoleToThemeClass(role);

    if (this.themeClass !== nextThemeClass) {
      this.themeClass = nextThemeClass;
    }

    if (!this.body) {
      return;
    }

    this.removeThemeClasses();
    this.body.classList.add(this.themeClass);
  }

  private removeThemeClasses(): void {
    if (!this.body) {
      return;
    }

    this.body.classList.remove('theme-admin', 'theme-operador', 'theme-gerente', 'theme-default');
  }

  private mapRoleToThemeClass(role: string | null): string {
    switch (role) {
      case 'ADMIN':
        return 'theme-admin';
      case 'OPERADOR':
        return 'theme-operador';
      case 'GERENTE':
        return 'theme-gerente';
      default:
        return 'theme-default';
    }
  }
}