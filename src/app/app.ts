import { Component, ChangeDetectionStrategy, OnDestroy, OnInit, inject } from '@angular/core';
import { Router, RouterOutlet, NavigationEnd } from '@angular/router';
import { filter, Subscription } from 'rxjs';
import { ToastContainerComponent } from './shared/components/toast-container/toast-container.component';
import { AuthService } from './core/services/auth.service';

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
  private readonly body = document.body;
  private routerSubscription?: Subscription;

  themeClass = 'theme-default';

  ngOnInit(): void {
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

  private syncThemeClass(): void {
    const role = this.authService.getRole();
    const nextThemeClass = this.mapRoleToThemeClass(role);

    if (this.themeClass !== nextThemeClass) {
      this.themeClass = nextThemeClass;
    }

    this.removeThemeClasses();
    this.body.classList.add(this.themeClass);
  }

  private removeThemeClasses(): void {
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
