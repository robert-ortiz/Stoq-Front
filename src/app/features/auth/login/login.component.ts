import { Component, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Router, RouterModule } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
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
    if (error.status === 401) {
      return 'Correo o contrasena incorrecta.';
    }

    const backendMessage = this.extractBackendMessage(error.error);

    if (backendMessage) {
      const normalized = backendMessage.toLowerCase();

      if (normalized.includes('unauthorized') || normalized.includes('incorrect') || normalized.includes('incorrecta')) {
        return 'Correo o contrasena incorrecta.';
      }
    }

    return 'No se pudo iniciar sesion. Intenta de nuevo.';
  }

  private extractBackendMessage(payload: unknown): string | null {
    if (!payload) {
      return null;
    }

    if (typeof payload === 'string') {
      const trimmed = payload.trim();

      if (!trimmed) {
        return null;
      }

      try {
        const parsed = JSON.parse(trimmed) as { message?: unknown; error?: unknown };

        if (typeof parsed.message === 'string' && parsed.message.trim()) {
          return parsed.message.trim();
        }

        if (typeof parsed.error === 'string' && parsed.error.trim()) {
          return parsed.error.trim();
        }

        return trimmed;
      } catch {
        return trimmed;
      }
    }

    if (typeof payload === 'object') {
      const record = payload as Record<string, unknown>;

      if (typeof record['message'] === 'string' && record['message'].trim()) {
        return record['message'].trim();
      }

      if (typeof record['error'] === 'string' && record['error'].trim()) {
        return record['error'].trim();
      }
    }

    return null;
  }

  get correo() { return this.form.get('correo'); }
  get contrasena() { return this.form.get('contrasena'); }
}