import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { forkJoin } from 'rxjs';
import { AuthService } from '../../../core/services/auth.service';
import { AuditLogApi, AuditLogService } from '../../../core/services/audit-log.service';
import { ProductoApi, ProductoService } from '../../../core/services/producto.service';
import { RoleService, RolApi } from '../../../core/services/role.service';
import { EditableUser, UserService } from '../../../core/services/user.service';
import { LanguageService } from '../../../core/services/language.service';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule, TranslatePipe],
  templateUrl: './admin-dashboard.component.html',
  styleUrl: './admin-dashboard.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AdminDashboardComponent implements OnInit {
  private userService = inject(UserService);
  private roleService = inject(RoleService);
  private auditService = inject(AuditLogService);
  private productoService = inject(ProductoService);
  private authService = inject(AuthService);
  private router = inject(Router);
  private cdr = inject(ChangeDetectorRef);
  private translateService = inject(TranslateService);
  private languageService = inject(LanguageService);

  users: EditableUser[] = [];
  roles: RolApi[] = [];
  auditLogs: AuditLogApi[] = [];
  productos: ProductoApi[] = [];

  loading = true;
  error = '';

  ngOnInit(): void {
    this.loadDashboard();
  }

  get totalUsuarios(): number {
    return this.users.length;
  }

  get totalRoles(): number {
    return this.roles.length;
  }

  get productosCriticos(): ProductoApi[] {
    return this.productos.filter((producto) => {
      const actual = producto.stockActual ?? 0;
      const minimo = producto.stockMinimo ?? 0;
      return actual <= minimo;
    });
  }

  get productosActivos(): number {
    return this.productos.filter((producto) => producto.estado !== false).length;
  }

  get auditRecentes(): AuditLogApi[] {
    return this.auditLogs.slice(0, 6);
  }

  private loadDashboard(): void {
    this.loading = true;
    this.error = '';

    forkJoin({
      users: this.userService.getUsers(),
      roles: this.roleService.getRoles(),
      auditLogs: this.auditService.getRecentLogs(),
      productos: this.productoService.getProductos()
    }).subscribe({
      next: ({ users, roles, auditLogs, productos }) => {
        this.users = users;
        this.roles = roles;
        this.auditLogs = auditLogs;
        this.productos = productos;
        this.loading = false;
        this.cdr.markForCheck();
      },
      error: () => {
        this.error = this.translateService.instant('DASHBOARD.ADMIN.ERROR_LOAD');
        this.loading = false;
        this.cdr.markForCheck();
      }
    });
  }

  formatDate(value: string | null | undefined): string {
    if (!value) {
      return '-';
    }

    return new Date(value).toLocaleString(this.languageService.getCurrentLocale(), {
      dateStyle: 'short',
      timeStyle: 'short'
    });
  }

  logout(): void {
    this.authService.logout();
    this.router.navigateByUrl('/auth/login');
  }
}
