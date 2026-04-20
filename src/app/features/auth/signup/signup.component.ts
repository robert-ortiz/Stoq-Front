import { Component, ChangeDetectionStrategy, inject } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { AbstractControl, FormBuilder, FormGroup, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
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

function validadorNombreCompletoMax(maxLength: number) {
  return (control: AbstractControl): ValidationErrors | null => {
    const nombre = (control.get('nombre')?.value ?? '').trim();
    const apellido1 = (control.get('apellido1')?.value ?? '').trim();
    const apellido2 = (control.get('apellido2')?.value ?? '').trim();
    const nombreCompleto = [nombre, apellido1, apellido2].filter(Boolean).join(' ');

    return nombreCompleto.length > maxLength ? { fullNameMaxLength: true } : null;
  };
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
    confirmarContrasena: 30,
    nombreCompleto: 120
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
      { validators: [validadorCoincidenciaContrasena, validadorNombreCompletoMax(this.maxLength.nombreCompleto)] }
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
    this.errorMessage = '';

    if (this.form.valid) {
      this.isLoading = true;
      this.errorMessage = '';
      
      const { nombre, apellido1, apellido2, correo, empresa, rol, contrasena } = this.form.value;
      const nombreLimpio = this.clipValue(nombre, this.maxLength.nombre);
      const apellido1Limpio = this.clipValue(apellido1, this.maxLength.apellido1);
      const apellido2Limpio = this.clipValue(apellido2, this.maxLength.apellido2);
      const correoLimpio = this.clipValue(correo, this.maxLength.correo).toLowerCase();
      const empresaLimpia = this.clipValue(empresa, this.maxLength.empresa);
      const contrasenaLimpia = this.clipValue(contrasena, this.maxLength.contrasena);
      const nombreCompleto = [nombreLimpio, apellido1Limpio, apellido2Limpio].filter(Boolean).join(' ');

      if (nombreCompleto.length > this.maxLength.nombreCompleto) {
        this.isLoading = false;
        this.errorMessage = `El nombre completo no puede superar ${this.maxLength.nombreCompleto} caracteres.`;
        return;
      }
      
      const signupData = {
        nombre: nombreCompleto,
        correo: correoLimpio,
        empresa: empresaLimpia,
        contrasena: contrasenaLimpia,
        rol: rol?.trim()?.toUpperCase()
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
    } else {
      this.form.markAllAsTouched();
    }
  }

  onInputLimit(controlName: keyof SignupComponent['maxLength'], event: Event): void {
    if (controlName === 'nombreCompleto') {
      return;
    }

    const target = event.target as HTMLInputElement | null;
    const max = this.maxLength[controlName] as number;
    const raw = target?.value ?? '';
    const clipped = raw.slice(0, max);

    if (target && clipped !== raw) {
      target.value = clipped;
    }

    const control = this.form.get(controlName as string);
    if (control && control.value !== clipped) {
      control.setValue(clipped, { emitEvent: false });
      control.updateValueAndValidity({ emitEvent: false });
      this.form.updateValueAndValidity({ emitEvent: false });
    }
  }

  private clipValue(value: unknown, max: number): string {
    return String(value ?? '').trim().slice(0, max);
  }

  private resolveErrorMessage(error: HttpErrorResponse): string {
    const fallback = 'Error al crear la cuenta. Intenta de nuevo.';

    if (error.status === 0) {
      return 'No se pudo conectar con el servidor. Verifica la conexión e intenta nuevamente.';
    }

    const parsed = this.parseErrorPayload(error.error);

    if (error.status === 409) {
      return parsed.message || 'El correo ya está registrado. Usa otro correo o inicia sesión.';
    }

    if (parsed.details.length > 0) {
      return parsed.details.join(' ');
    }

    if (parsed.message) {
      return parsed.message;
    }

    return fallback;
  }

  private parseErrorPayload(payload: unknown): { message: string; details: string[] } {
    const parsedObject = this.toObject(payload);
    if (!parsedObject) {
      if (typeof payload === 'string' && payload.trim()) {
        return { message: payload.trim(), details: [] };
      }

      return { message: '', details: [] };
    }

    const message = typeof parsedObject['message'] === 'string' ? parsedObject['message'].trim() : '';
    const rawDetails = parsedObject['details'];
    const details: string[] = [];

    if (rawDetails && typeof rawDetails === 'object') {
      for (const value of Object.values(rawDetails as Record<string, unknown>)) {
        if (typeof value === 'string' && value.trim()) {
          details.push(value.trim());
        }
      }
    }

    return { message, details };
  }

  private toObject(value: unknown): Record<string, unknown> | null {
    if (!value) {
      return null;
    }

    if (typeof value === 'object') {
      return value as Record<string, unknown>;
    }

    if (typeof value === 'string') {
      const text = value.trim();
      if (!text.startsWith('{')) {
        return null;
      }

      try {
        const parsed = JSON.parse(text) as unknown;
        return typeof parsed === 'object' && parsed !== null ? (parsed as Record<string, unknown>) : null;
      } catch {
        return null;
      }
    }

    return null;
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
