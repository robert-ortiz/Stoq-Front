import { Component, ChangeDetectionStrategy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-home-page',
  standalone: true,
  imports: [CommonModule, RouterModule],
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

  get isAuthenticated(): boolean {
    return this.authService.isAuthenticated();
  }

  get displayName(): string {
    return this.authService.getDisplayName() || 'Usuario';
  }

  get role(): string {
    return this.authService.getRole() || 'SIN ROL';
  }

  get company(): string {
    return this.authService.getCompany() || 'Empresa no disponible';
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
