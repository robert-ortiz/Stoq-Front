import { Component, ChangeDetectionStrategy } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

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

  constructor(private fb: FormBuilder) {
    this.form = this.fb.group(
      {
        firstName: ['', [Validators.required, Validators.minLength(1)]],
        lastName1: ['', [Validators.required, Validators.minLength(1)]],
        lastName2: ['', []],
        email: ['', [Validators.required, Validators.email]],
        company: ['', []],
        password: ['', [Validators.required, Validators.minLength(6)]],
        confirmPassword: ['', [Validators.required]]
      },
      { validators: passwordMatchValidator }
    );
  }

  onSubmit(): void {
    if (this.form.valid) {
      this.isLoading = true;
      const { firstName, lastName1, lastName2, email, company, password } = this.form.value;
      const fullName = `${firstName} ${lastName1}${lastName2 ? ' ' + lastName2 : ''}`;
      console.log('Signup attempt:', { fullName, email, company, password });
      // TODO: call registration service
      setTimeout(() => (this.isLoading = false), 1500);
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
  get password() {
    return this.form.get('password');
  }
  get confirmPassword() {
    return this.form.get('confirmPassword');
  }
}
