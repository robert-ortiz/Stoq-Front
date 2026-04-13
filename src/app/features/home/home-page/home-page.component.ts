import { Component, ChangeDetectionStrategy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { AuthService } from '../../../core/services/auth.service';

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
export class HomePageComponent {
  private authService = inject(AuthService);
  private router = inject(Router);
  private translateService = inject(TranslateService);

  get isAuthenticated(): boolean {
    return this.authService.isAuthenticated();
  }

  get displayName(): string {
    return this.authService.getDisplayName() || this.translateService.instant('HOME.AUTH.DEFAULT_USER');
  }

  get role(): string {
    return this.authService.getRole() || 'NO_ROLE';
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
    return this.authService.getCompany() || this.translateService.instant('HOME.AUTH.DEFAULT_COMPANY');
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

  goToAdmin(): void {
    this.router.navigateByUrl('/admin');
  }

  goToOperator(): void {
    this.router.navigateByUrl('/operador');
  }

  goToManager(): void {
    this.router.navigateByUrl('/gerente');
  }

  logout(): void {
    this.authService.logout();
    this.router.navigateByUrl('/auth/login');
  }
}
