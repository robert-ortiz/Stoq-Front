import { Component, ChangeDetectionStrategy, inject } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

function passwordMatchValidator(group: FormGroup) {
  const password = group.get('password')?.value;
  const confirm = group.get('confirmPassword')?.value;
  return password === confirm ? null : { mismatch: true };
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
  private authService = inject(AuthService);
  private router = inject(Router);

  constructor(private fb: FormBuilder) {
    this.form = this.fb.group(
      {
        firstName: ['', [Validators.required, Validators.minLength(1)]],
        lastName1: ['', [Validators.required, Validators.minLength(1)]],
        lastName2: ['', []],
        email: ['', [Validators.required, Validators.email]],
        company: ['', []],
        role: ['OPERADOR', [Validators.required]],
        password: ['', [Validators.required, Validators.minLength(6)]],
        confirmPassword: ['', [Validators.required]]
      },
      { validators: passwordMatchValidator }
    );
  }

  onSubmit(): void {
    if (this.form.valid) {
      this.isLoading = true;
      this.errorMessage = '';
      
      const { firstName, lastName1, lastName2, email, company, role, password } = this.form.value;
      const fullName = `${firstName} ${lastName1}${lastName2 ? ' ' + lastName2 : ''}`;
      
      const signupData = {
        nombre: fullName,
        correo: email,
        empresa: company || '',
        contrasena: password,
        rol: role
      };

      this.authService.signup(signupData).subscribe({
        next: (response) => {
          localStorage.setItem('token', response.token);
          this.isLoading = false;
          this.router.navigate(['/home']);
        },
        error: (error) => {
          this.isLoading = false;
          this.errorMessage = error.error?.message || 'Error al crear la cuenta. Intenta de nuevo.';
          console.error('Signup error:', error);
        }
      });
    }
  }

  get firstName() {
    return this.form.get('firstName');
  }
  get lastName1() {
    return this.form.get('lastName1');
  }
  get lastName2() {
    return this.form.get('lastName2');
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
