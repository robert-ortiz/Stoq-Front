import { Component, ChangeDetectionStrategy, inject } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { AuthService } from '../../../core/services/auth.service';
import { RoleService } from '../../../core/services/role.service';
import { FormShellComponent } from '../../../shared/components/form-shell/form-shell.component';

function validadorCoincidenciaContrasena(group: FormGroup) {
  const contrasena = group.get('contrasena')?.value;
  const confirmarContrasena = group.get('confirmarContrasena')?.value;
  return contrasena === confirmarContrasena ? null : { mismatch: true };
}

@Component({
  selector: 'app-signup',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule, FormShellComponent, TranslatePipe],
  templateUrl: './signup.component.html',
  styleUrl: './signup.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'login-container'
  }
})
export class SignupComponent {
  form: FormGroup;
  isLoading = false;
  errorMessage = '';
  readonly maxLength = {
    nombre: 25,
    apellido1: 25,
    apellido2: 25,
    correo: 60,
    empresa: 20,
    contrasena: 30,
    confirmarContrasena: 30
  };
  private authService = inject(AuthService);
  private router = inject(Router);
  private roleService = inject(RoleService);
  roles: string[] = ['ADMIN', 'OPERADOR', 'GERENTE'];

  constructor(private fb: FormBuilder) {
    this.form = this.fb.group(
      {
        nombre: ['', [Validators.required, Validators.minLength(1), Validators.maxLength(this.maxLength.nombre)]],
        apellido1: ['', [Validators.required, Validators.minLength(1), Validators.maxLength(this.maxLength.apellido1)]],
        apellido2: ['', [Validators.maxLength(this.maxLength.apellido2)]],
        correo: ['', [Validators.required, Validators.email, Validators.maxLength(this.maxLength.correo)]],
        empresa: ['', [Validators.maxLength(this.maxLength.empresa)]],
        rol: ['OPERADOR', [Validators.required]],
        contrasena: ['', [Validators.required, Validators.minLength(6), Validators.maxLength(this.maxLength.contrasena)]],
        confirmarContrasena: ['', [Validators.required, Validators.maxLength(this.maxLength.confirmarContrasena)]]
      },
      { validators: validadorCoincidenciaContrasena }
    );

    this.roleService.getRoles().subscribe({
      next: (roles) => {
        const allowedRoles = roles.map((role) => role.nombre);
        if (allowedRoles.length > 0) {
          this.roles = allowedRoles;
        }
      }
    });
  }

  onSubmit(): void {
    if (this.form.valid) {
      this.isLoading = true;
      this.errorMessage = '';
      
      const { nombre, apellido1, apellido2, correo, empresa, rol, contrasena } = this.form.value;
      const nombreCompleto = [nombre?.trim(), apellido1?.trim(), apellido2?.trim()].filter(Boolean).join(' ');
      
      const signupData = {
        nombre: nombreCompleto,
        correo: correo?.trim(),
        empresa: empresa?.trim() || '',
        contrasena,
        rol
      };

      this.authService.signup(signupData).subscribe({
        next: (response) => {
          this.authService.saveSession(response);
          this.isLoading = false;
          this.router.navigate([this.authService.getLandingRoute()]);
        },
        error: (error) => {
          this.isLoading = false;
          this.errorMessage = this.resolveErrorMessage(error);
          console.error('Signup error:', error);
        }
      });
    }
  }

  private resolveErrorMessage(error: HttpErrorResponse): string {
    if (!error.error) {
      return 'Error al crear la cuenta. Intenta de nuevo.';
    }

    if (typeof error.error === 'string') {
      return error.error;
    }

    return error.error.message || 'Error al crear la cuenta. Intenta de nuevo.';
  }

  get nombre() {
    return this.form.get('nombre');
  }
  get apellido1() {
    return this.form.get('apellido1');
  }
  get apellido2() {
    return this.form.get('apellido2');
  }
  get correo() {
    return this.form.get('correo');
  }
  get empresa() {
    return this.form.get('empresa');
  }
  get rol() {
    return this.form.get('rol');
  }
  get contrasena() {
    return this.form.get('contrasena');
  }
  get confirmarContrasena() {
    return this.form.get('confirmarContrasena');
  }
}
