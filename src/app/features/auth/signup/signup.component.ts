import { Component, ChangeDetectionStrategy, ChangeDetectorRef, inject } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { AuthService, UserRole } from '../../../core/services/auth.service';

function passwordMatchValidator(group: FormGroup) {
  const password = group.get('password')?.value;
  const confirm = group.get('confirmPassword')?.value;
  return password === confirm ? null : { mismatch: true };
}

function passwordComplexityValidator(group: FormGroup) {
  const password = (group.get('password')?.value ?? '') as string;
  const hasUpper = /[A-Z]/.test(password);
  const hasNumber = /\d/.test(password);
  return hasUpper && hasNumber ? null : { weakPassword: true };
}

@Component({
  selector: 'app-signup',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
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
  successMessage = '';
  showPassword = false;
  showConfirmPassword = false;

  readonly roles: UserRole[] = ['ADMINISTRADOR', 'GERENTE', 'OPERADOR'];

  private authService = inject(AuthService);
  private router = inject(Router);
  private cdr = inject(ChangeDetectorRef);

  constructor(private fb: FormBuilder) {
    this.form = this.fb.group(
      {
        fullName: ['', [Validators.required, Validators.minLength(3)]],
        email: ['', [Validators.required, Validators.email]],
        company: ['', []],
        role: ['OPERADOR', [Validators.required]],
        password: ['', [Validators.required, Validators.minLength(6)]],
        confirmPassword: ['', [Validators.required]]
      },
      { validators: [passwordMatchValidator, passwordComplexityValidator] }
    );
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';
    this.successMessage = '';

    const { fullName, email, company, role, password } = this.form.value;
    this.authService
      .signup({
        nombre: fullName,
        correo: email,
        empresa: company,
        contrasena: password,
        rol: role
      })
      .subscribe({
        next: () => {
          this.isLoading = false;
          this.successMessage = 'Registro exitoso. Ahora puedes iniciar sesion.';
          this.cdr.markForCheck();
          this.router.navigate(['/auth/login']);
        },
        error: () => {
          this.isLoading = false;
          this.errorMessage = 'No se pudo crear la cuenta. Revisa los datos e intenta de nuevo.';
          this.cdr.markForCheck();
        }
      });
  }

  togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
  }

  toggleConfirmPasswordVisibility(): void {
    this.showConfirmPassword = !this.showConfirmPassword;
  }

  get fullName() {
    return this.form.get('fullName');
  }
  get email() {
    return this.form.get('email');
  }
  get company() {
    return this.form.get('company');
  }
  get role() {
    return this.form.get('role');
  }
  get password() {
    return this.form.get('password');
  }
  get confirmPassword() {
    return this.form.get('confirmPassword');
  }
}
