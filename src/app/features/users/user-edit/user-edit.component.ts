import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { UserService } from '../../../core/services/user.service';
import { RoleService } from '../../../core/services/role.service';
import { AuthService } from '../../../core/services/auth.service';
import { FormShellComponent } from '../../../shared/components/form-shell/form-shell.component';

@Component({
  selector: 'app-user-edit',
  imports: [CommonModule, ReactiveFormsModule, RouterModule, FormShellComponent, TranslatePipe],
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
  private translateService = inject(TranslateService);

  userId = this.route.snapshot.paramMap.get('id');
  isOwnAccount = !this.userId;
  isLoading = false;
  isSaving = false;
  isDeleting = false;
  showDeleteConfirm = false;
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
        this.errorMessage = this.translateService.instant('USER.EDIT.ERROR_LOAD');
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
        this.successMessage = this.translateService.instant('USER.EDIT.SUCCESS_UPDATE');
        this.cdr.markForCheck();
      },
      error: () => {
        this.isSaving = false;
        this.errorMessage = this.translateService.instant('USER.EDIT.ERROR_UPDATE');
        this.cdr.markForCheck();
      }
    });
  }

  onDelete(): void {
    this.showDeleteConfirm = true;
    this.cdr.markForCheck();
  }

  onCloseDeleteConfirm(): void {
    if (this.isDeleting) {
      return;
    }

    this.showDeleteConfirm = false;
    this.cdr.markForCheck();
  }

  onConfirmDelete(): void {
    const targetKey = this.isOwnAccount ? 'USER.EDIT.DELETE_TARGET_ACCOUNT' : 'USER.EDIT.DELETE_TARGET_USER';
    const target = this.translateService.instant(targetKey);

    this.isDeleting = true;
    this.errorMessage = '';
    this.successMessage = '';

    const request$ = this.isOwnAccount
      ? this.userService.deleteCurrentUser()
      : this.userService.deleteUserById(this.userId!);

    request$.subscribe({
      next: () => {
        this.isDeleting = false;
        this.showDeleteConfirm = false;
        if (this.isOwnAccount) {
          this.authService.logout();
          this.router.navigate(['/auth/login']);
          return;
        }

        this.router.navigate(['/admin']);
      },
      error: () => {
        this.isDeleting = false;
        this.showDeleteConfirm = false;
        this.errorMessage = this.translateService.instant('USER.EDIT.ERROR_DELETE');
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