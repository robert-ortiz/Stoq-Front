import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { FormBuilder, FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { ChangeDetectorRef } from '@angular/core';

import { AuthService } from '../../../core/services/auth.service';
import { EditableUser, UserService } from '../../../core/services/user.service';
import { LanguageCode, LanguageService } from '../../../core/services/language.service';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule, ReactiveFormsModule, TranslatePipe],
  templateUrl: './admin-dashboard.component.html',
  styleUrl: './admin-dashboard.component.css'
})
export class AdminDashboardComponent implements OnInit {
  private authService = inject(AuthService);
  private userService = inject(UserService);
  private languageService = inject(LanguageService);
  private router = inject(Router);
  private fb = inject(FormBuilder);
  private cdr = inject(ChangeDetectorRef);

  activeTab: 'usuarios' | 'empresas' = 'usuarios';

  currentLanguage: LanguageCode = this.languageService.getCurrentLanguage();
  readonly availableLanguages = this.languageService.supportedLanguages;

  usuarios: EditableUser[] = [];
  usuariosFiltrados: EditableUser[] = [];

  searchControl = new FormControl('');

  cargando = false;
  error = '';

  paginaActual = 1;
  registrosPorPagina = 8;

  mostrarModalCrear = false;
  mostrarModalEditar = false;
  usuarioEditando: EditableUser | null = null;

  userForm = this.fb.group({
    nombre: ['', [Validators.required, Validators.minLength(2)]],
    correo: ['', [Validators.required, Validators.email]],
    contrasena: ['', [Validators.required, Validators.minLength(6)]],
    empresa: ['', Validators.required],
    estado: [true, Validators.required],
    rol: ['OPERADOR', Validators.required]
  });

  editForm = this.fb.group({
    nombre: ['', [Validators.required, Validators.minLength(2)]],
    correo: ['', [Validators.required, Validators.email]],
    empresa: ['', Validators.required],
    estado: [true, Validators.required],
    rol: ['OPERADOR', Validators.required]
  });

  ngOnInit(): void {
    this.currentLanguage = this.languageService.getCurrentLanguage();
    this.cargarUsuarios();

    this.searchControl.valueChanges.subscribe(() => {
      this.filtrarUsuarios();
    });
  }

  onLanguageChange(language: string): void {
    this.languageService.setLanguage(language as LanguageCode);
    this.currentLanguage = this.languageService.getCurrentLanguage();
  }

  cargarUsuarios(): void {
    this.cargando = true;
    this.error = '';
    this.cdr.markForCheck();

    this.userService.getUsers().subscribe({
      next: (usuarios) => {
        this.usuarios = usuarios;
        this.usuariosFiltrados = usuarios;
        this.cargando = false;
        this.cdr.markForCheck();
      },
      error: () => {
        this.error = 'No se pudieron cargar los usuarios.';
        this.cargando = false;
        this.cdr.markForCheck();
      }
    });
  }

  filtrarUsuarios(): void {
    const query = (this.searchControl.value ?? '').toLowerCase().trim();

    this.usuariosFiltrados = this.usuarios.filter((usuario) =>
      usuario.nombre?.toLowerCase().includes(query) ||
      usuario.correo?.toLowerCase().includes(query) ||
      usuario.empresa?.toLowerCase().includes(query) ||
      usuario.rol?.toLowerCase().includes(query)
    );

    this.paginaActual = 1;
  }

  get usuariosPaginados(): EditableUser[] {
    const inicio = (this.paginaActual - 1) * this.registrosPorPagina;
    const fin = inicio + this.registrosPorPagina;
    return this.usuariosFiltrados.slice(inicio, fin);
  }

  get totalPaginas(): number {
    return Math.max(1, Math.ceil(this.usuariosFiltrados.length / this.registrosPorPagina));
  }

  get desdeRegistro(): number {
    if (!this.usuariosFiltrados.length) return 0;
    return (this.paginaActual - 1) * this.registrosPorPagina + 1;
  }

  get hastaRegistro(): number {
    return Math.min(this.paginaActual * this.registrosPorPagina, this.usuariosFiltrados.length);
  }

  paginaAnterior(): void {
    if (this.paginaActual > 1) {
      this.paginaActual--;
    }
  }

  paginaSiguiente(): void {
    if (this.paginaActual < this.totalPaginas) {
      this.paginaActual++;
    }
  }

  abrirModalCrearUsuario(): void {
    this.error = '';
    this.mostrarModalCrear = true;
  }

  cerrarModalCrearUsuario(): void {
    this.mostrarModalCrear = false;

    this.userForm.reset({
      nombre: '',
      correo: '',
      contrasena: '',
      empresa: '',
      estado: true,
      rol: 'OPERADOR'
    });
  }

  crearUsuario(): void {
    if (this.userForm.invalid) {
      this.userForm.markAllAsTouched();
      return;
    }

    const value = this.userForm.getRawValue();

    const payload = {
      nombre: value.nombre ?? '',
      correo: value.correo ?? '',
      contrasena: value.contrasena ?? '',
      empresa: value.empresa ?? '',
      rol: value.rol ?? 'OPERADOR'
    };

    this.authService.signup(payload).subscribe({
      next: () => {
        this.cerrarModalCrearUsuario();
        this.cargarUsuarios();
      },
      error: () => {
        this.error = 'No se pudo crear el usuario.';
      }
    });
  }

  editarUsuario(usuario: EditableUser): void {
    this.error = '';
    this.usuarioEditando = usuario;
    this.mostrarModalEditar = true;

    this.editForm.patchValue({
      nombre: usuario.nombre,
      correo: usuario.correo,
      empresa: usuario.empresa,
      estado: usuario.estado,
      rol: usuario.rol
    });
  }

  cerrarModalEditarUsuario(): void {
    this.mostrarModalEditar = false;
    this.usuarioEditando = null;

    this.editForm.reset({
      nombre: '',
      correo: '',
      empresa: '',
      estado: true,
      rol: 'OPERADOR'
    });
  }

  guardarCambiosUsuario(): void {
    if (this.editForm.invalid || !this.usuarioEditando) {
      this.editForm.markAllAsTouched();
      return;
    }

    const value = this.editForm.getRawValue();

    const payload = {
      nombre: value.nombre ?? '',
      correo: value.correo ?? '',
      empresa: value.empresa ?? '',
      rol: value.rol ?? 'OPERADOR',
      estado: value.estado ?? true
    };

    this.userService.updateUserById(this.usuarioEditando.id, payload).subscribe({
      next: () => {
        this.cerrarModalEditarUsuario();
        this.cargarUsuarios();
      },
      error: () => {
        this.error = 'No se pudo actualizar el usuario.';
      }
    });
  }

  eliminarUsuario(): void {
    if (!this.usuarioEditando) {
      return;
    }

    this.userService.deleteUserById(this.usuarioEditando.id).subscribe({
      next: () => {
        this.cerrarModalEditarUsuario();
        this.cargarUsuarios();
      },
      error: () => {
        this.error = 'No se pudo eliminar el usuario.';
      }
    });
  }

  logout(): void {
    this.authService.logout();
    this.router.navigateByUrl('/auth/login');
  }
}