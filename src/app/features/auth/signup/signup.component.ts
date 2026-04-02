import { Component, ChangeDetectionStrategy, inject } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
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
  imports: [CommonModule, ReactiveFormsModule, RouterModule, FormShellComponent],
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
  private authService = inject(AuthService);
  private router = inject(Router);
  private roleService = inject(RoleService);
  roles: string[] = ['ADMIN', 'OPERADOR', 'GERENTE'];

  constructor(private fb: FormBuilder) {
    this.form = this.fb.group(
      {
        nombre: ['', [Validators.required, Validators.minLength(1)]],
        apellido1: ['', [Validators.required, Validators.minLength(1)]],
        apellido2: ['', []],
        correo: ['', [Validators.required, Validators.email]],
        empresa: ['', []],
        rol: ['OPERADOR', [Validators.required]],
        contrasena: ['', [Validators.required, Validators.minLength(6)]],
        confirmarContrasena: ['', [Validators.required]]
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
      const nombreCompleto = `${nombre} ${apellido1}${apellido2 ? ' ' + apellido2 : ''}`;
      
      const signupData = {
        nombre: nombreCompleto,
        correo,
        empresa: empresa || '',
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
          this.errorMessage = error.error?.message || 'Error al crear la cuenta. Intenta de nuevo.';
          console.error('Signup error:', error);
        }
      });
    }
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
