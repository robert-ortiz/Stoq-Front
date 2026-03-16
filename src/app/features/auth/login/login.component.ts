import { Component, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
// Asegúrate de que esta ruta apunte correctamente a donde guardaste el servicio
import { AuthService } from '../../../../app/core/services/auth.service';
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

  constructor(
    private fb: FormBuilder, 
    private router: Router,
    private authService: AuthService,
    private cdr: ChangeDetectorRef // Inyectamos esto para actualizar la vista manualmente
  ) {
    this.form = this.fb.group({
      username: ['', [Validators.required, Validators.minLength(3)]],
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
    const credentials = this.form.value;

    // Llamada real al backend
    this.authService.login(credentials).subscribe({
      next: (response) => {
        console.log('Login exitoso. Token:', response.token);
        
        // Guardamos el token en localStorage
        localStorage.setItem('token', response.token);
        
        this.isLoading = false;
        this.cdr.markForCheck(); // Le avisamos a Angular que detenga la animación de carga
        
        // Navegamos al catálogo de productos
        this.router.navigate(['/productos']);
      },
      error: (err) => {
        console.error('Error al iniciar sesión:', err);
        // Si el backend lanza error 401 o 403, mostramos este mensaje
        this.errorMessage = 'Correo o contraseña incorrectos';
        this.isLoading = false;
        this.cdr.markForCheck(); // Le avisamos a Angular que muestre el mensaje de error
      }
    });
  }

  get username() { return this.form.get('username'); }
  get password() { return this.form.get('password'); }
}