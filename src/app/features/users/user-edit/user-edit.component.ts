import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { UserService } from '../../../core/services/user.service';
import { RoleService } from '../../../core/services/role.service';
import { AuthService } from '../../../core/services/auth.service';
import { FormShellComponent } from '../../../shared/components/form-shell/form-shell.component';

@Component({
  selector: 'app-user-edit',
  imports: [CommonModule, ReactiveFormsModule, RouterModule, FormShellComponent],
  templateUrl: './user-edit.component.html',
  styleUrl: './user-edit.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'user-edit-container'
  }
})
export class UserEditComponent implements OnInit {
  private fb = inject(FormBuilder);
  private userService = inject(UserService);
  private roleService = inject(RoleService);
  readonly authService = inject(AuthService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private cdr = inject(ChangeDetectorRef);

  userId = this.route.snapshot.paramMap.get('id');
  isOwnAccount = !this.userId;
  isLoading = false;
  isSaving = false;
  isDeleting = false;
  errorMessage = '';
  successMessage = '';
  roles: string[] = ['ADMIN', 'OPERADOR', 'GERENTE'];

  form = this.fb.group({
    nombre: ['', [Validators.required, Validators.minLength(2)]],
    correo: ['', [Validators.required, Validators.email]],
    empresa: ['', []],
    estado: [true, []],
    rol: [{ value: 'OPERADOR', disabled: this.isOwnAccount }, [Validators.required]]
  });

  ngOnInit(): void {
    this.roleService.getRoles().subscribe({
      next: (roles) => {
        const allowedRoles = roles.map((role) => role.nombre);
        if (allowedRoles.length > 0) {
          this.roles = allowedRoles;
        }
      }
    });

    this.loadUserData();
  }

  private loadUserData(): void {
    this.isLoading = true;
    this.errorMessage = '';

    const request$ = this.isOwnAccount
      ? this.userService.getCurrentUser()
      : this.userService.getUserById(this.userId!);

    request$.subscribe({
      next: (user) => {
        this.form.patchValue({
          nombre: user.nombre ?? '',
          correo: user.correo ?? '',
          empresa: user.empresa ?? '',
          estado: user.estado ?? true,
          rol: user.rol ?? 'OPERADOR'
        });
        this.isLoading = false;
        this.cdr.markForCheck();
      },
      error: () => {
        this.errorMessage = 'No se pudo cargar la información del usuario.';
        this.isLoading = false;
        this.cdr.markForCheck();
      }
    });
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.isSaving = true;
    this.errorMessage = '';
    this.successMessage = '';

    const raw = this.form.getRawValue();
    const payload = {
      nombre: raw.nombre?.trim() ?? '',
      correo: raw.correo?.trim().toLowerCase() ?? '',
      empresa: raw.empresa?.trim() ?? '',
      estado: raw.estado ?? true,
      rol: raw.rol ?? 'OPERADOR'
    };

    const request$ = this.isOwnAccount
      ? this.userService.updateCurrentUser(payload)
      : this.userService.updateUserById(this.userId!, payload);

    request$.subscribe({
      next: () => {
        this.isSaving = false;
        this.successMessage = 'Datos actualizados correctamente.';
        this.cdr.markForCheck();
      },
      error: () => {
        this.isSaving = false;
        this.errorMessage = 'No fue posible actualizar el usuario. Intenta de nuevo.';
        this.cdr.markForCheck();
      }
    });
  }

  onDelete(): void {
    const target = this.isOwnAccount ? 'tu cuenta' : 'este usuario';
    const confirmed = window.confirm(`¿Seguro que deseas eliminar ${target}? Esta acción no se puede deshacer.`);

    if (!confirmed) {
      return;
    }

    this.isDeleting = true;
    this.errorMessage = '';
    this.successMessage = '';

    const request$ = this.isOwnAccount
      ? this.userService.deleteCurrentUser()
      : this.userService.deleteUserById(this.userId!);

    request$.subscribe({
      next: () => {
        this.isDeleting = false;
        if (this.isOwnAccount) {
          this.authService.logout();
          this.router.navigate(['/auth/login']);
          return;
        }

        this.router.navigate(['/admin']);
      },
      error: () => {
        this.isDeleting = false;
        this.errorMessage = 'No se pudo eliminar el usuario. Intenta nuevamente.';
        this.cdr.markForCheck();
      }
    });
  }

  get nombre() {
    return this.form.get('nombre');
  }

  get correo() {
    return this.form.get('correo');
  }

  get empresa() {
    return this.form.get('empresa');
  }
}