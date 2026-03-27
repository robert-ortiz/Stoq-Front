import { Component, ChangeDetectionStrategy, ChangeDetectorRef, inject } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'login-container'
  }
})
export class LoginComponent {
  form: FormGroup;
  isLoading = false;
  errorMessage = '';
  showPassword = false;

  private authService = inject(AuthService);
  private router = inject(Router);
  private cdr = inject(ChangeDetectorRef);

  constructor(private fb: FormBuilder) {
    this.form = this.fb.group({
      correo: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]]
    });
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';

    const { correo, password } = this.form.value;
    this.authService.login({ correo, password }).subscribe({
      next: (response) => {
        const token = response.access_token ?? response.token;
        if (!token) {
          this.errorMessage = 'No se recibio token de autenticacion.';
          this.isLoading = false;
          this.cdr.markForCheck();
          return;
        }

        localStorage.setItem('access_token', token);
        localStorage.setItem('user', JSON.stringify(response.user));
        this.isLoading = false;
        this.cdr.markForCheck();
        this.router.navigate(['/']);
      },
      error: () => {
        this.errorMessage = 'Credenciales invalidas. Verifica correo y contrasena.';
        this.isLoading = false;
        this.cdr.markForCheck();
      }
    });
  }

  togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
  }

  get correo() {
    return this.form.get('correo');
  }

  get password() {
    return this.form.get('password');
  }
}
