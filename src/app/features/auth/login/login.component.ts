import { Component, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Router, RouterModule } from '@angular/router';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { AuthService } from '../../../../app/core/services/auth.service';
import { FormShellComponent } from '../../../shared/components/form-shell/form-shell.component';
@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule, FormShellComponent, TranslatePipe],
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

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private authService: AuthService,
    private translateService: TranslateService,
    private cdr: ChangeDetectorRef
  ) {
    this.form = this.fb.group({
      correo: ['', [Validators.required, Validators.email]],
      contrasena: ['', [Validators.required, Validators.minLength(6)]]
    });
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';
    const credentials = this.form.value;

    // Llamada real al backend
    this.authService.login(credentials).subscribe({
      next: (response) => {
        this.authService.saveSession(response);

        this.isLoading = false;
        this.cdr.markForCheck();

        this.router.navigateByUrl(this.authService.getLandingRoute());
      },
      error: (err) => {
        console.error('Error al iniciar sesión:', err);
        this.errorMessage = this.resolveErrorMessage(err);
        this.isLoading = false;
        this.cdr.markForCheck();
      }
    });
  }

  private resolveErrorMessage(error: HttpErrorResponse): string {
    if (!error.error) {
      return 'No se pudo iniciar sesión. Intenta de nuevo.';
    }

    if (typeof error.error === 'string') {
      return error.error;
    }

    return error.error.message || 'No se pudo iniciar sesión. Intenta de nuevo.';
  }

  get correo() { return this.form.get('correo'); }
  get contrasena() { return this.form.get('contrasena'); }
}