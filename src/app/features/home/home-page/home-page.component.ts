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

  readonly isAuthenticated = this.authService.isAuthenticated();
  readonly displayName = this.authService.getDisplayName() || 'Usuario';
  readonly role = this.authService.getRole() || 'SIN ROL';
  readonly company = this.authService.getCompany() || 'Empresa no disponible';
  readonly isAdmin = this.role === 'ADMIN';
  readonly isOperator = this.role === 'OPERADOR';
  readonly isManager = this.role === 'GERENTE';

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
