import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { FormBuilder, FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { ChangeDetectorRef } from '@angular/core';

import { AuthService } from '../../../core/services/auth.service';
import { EditableUser, UserService } from '../../../core/services/user.service';
import { LanguageCode, LanguageService } from '../../../core/services/language.service';
import { ToastService } from '../../../core/services/toast.service';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule, ReactiveFormsModule, TranslateModule],
  templateUrl: './admin-dashboard.component.html',
  styleUrl: './admin-dashboard.component.css'
})
export class AdminDashboardComponent implements OnInit {
  private authService = inject(AuthService);
  private userService = inject(UserService);
  private languageService = inject(LanguageService);
  private translateService = inject(TranslateService);
  private toastService = inject(ToastService);
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
  creandoUsuario = false;
  isDeleting = false;
  showDeleteConfirmModal = false;
  deleteConfirmMessage = '';
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
    if (this.creandoUsuario || this.userForm.invalid) {
      this.userForm.markAllAsTouched();
      return;
    }

    this.creandoUsuario = true;

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
        this.creandoUsuario = false;
        this.toastService.success('Cuenta creada con exito.');
        this.cerrarModalCrearUsuario();
        this.cargarUsuarios();
      },
      error: (error: HttpErrorResponse) => {
        this.creandoUsuario = false;
        const message = this.resolveCreateUserError(error);
        this.error = message;

        if (this.isCorreoYaRegistrado(error, message)) {
          this.toastService.error('El correo ya esta registrado.');
          return;
        }

        this.toastService.error(message);
      }
    });
  }

  private isCorreoYaRegistrado(error: HttpErrorResponse, message: string): boolean {
    if (error.status === 409) {
      return true;
    }

    const normalized = message.toLowerCase();
    return (
      (normalized.includes('correo') && normalized.includes('registrado')) ||
      normalized.includes('already registered') ||
      normalized.includes('query did not return a unique result')
    );
  }

  private resolveCreateUserError(error: HttpErrorResponse): string {
    const fallback = 'No se pudo crear el usuario.';

    if (error.status === 0) {
      return 'No se pudo conectar con el servidor.';
    }

    const payload = this.toObject(error.error);
    const message = typeof payload?.['message'] === 'string' ? payload['message'].trim() : '';
    const details = payload?.['details'];

    if (details && typeof details === 'object') {
      const detailMessages = Object.values(details as Record<string, unknown>)
        .filter((value): value is string => typeof value === 'string' && value.trim().length > 0)
        .map((value) => this.translateErrorMessageToSpanish(value.trim()))
        .filter((value) => value.length > 0);

      if (detailMessages.length > 0) {
        return detailMessages.join(' ');
      }
    }

    if (message) {
      const translated = this.translateErrorMessageToSpanish(message);
      if (translated) {
        return translated;
      }
    }

    return fallback;
  }

  private translateErrorMessageToSpanish(message: string): string {
    const normalized = message.toLowerCase();

    if (
      (normalized.includes('correo') && normalized.includes('registrado')) ||
      normalized.includes('already registered') ||
      normalized.includes('query did not return a unique result')
    ) {
      return 'El correo ya esta registrado.';
    }

    if (normalized.includes('rol no permitido') || normalized.includes('role not allowed')) {
      return 'El rol seleccionado no es valido.';
    }

    if (normalized.includes('rol no encontrado') || normalized.includes('role not found')) {
      return 'No se encontro el rol seleccionado.';
    }

    if (normalized.includes('datos de entrada invalidos') || normalized.includes('invalid input')) {
      return 'Datos de entrada invalidos.';
    }

    if (normalized.includes('contrasena') && normalized.includes('obligatoria')) {
      return 'La contrasena es obligatoria.';
    }

    if (normalized.includes('correo') && normalized.includes('formato')) {
      return 'El correo no tiene un formato valido.';
    }

    if (
      normalized.includes('no se pudo conectar') ||
      normalized.includes('failed to fetch') ||
      normalized.includes('network')
    ) {
      return 'No se pudo conectar con el servidor.';
    }

    return '';
  }

  private toObject(payload: unknown): Record<string, unknown> | null {
    if (!payload) {
      return null;
    }

    if (typeof payload === 'object') {
      return payload as Record<string, unknown>;
    }

    if (typeof payload === 'string') {
      try {
        const parsed = JSON.parse(payload) as unknown;
        if (parsed && typeof parsed === 'object') {
          return parsed as Record<string, unknown>;
        }
      } catch {
        return null;
      }
    }

    return null;
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

    if (this.creandoUsuario || this.isDeleting) {
      return;
    }

    const target = this.translateService.instant('USER.EDIT.DELETE_TARGET_USER');
    this.deleteConfirmMessage = this.translateService.instant('USER.EDIT.CONFIRM_DELETE', { target });
    this.showDeleteConfirmModal = true;
    this.cdr.markForCheck();
  }

  cancelarEliminarUsuario(): void {
    if (this.isDeleting) {
      return;
    }

    this.showDeleteConfirmModal = false;
    this.deleteConfirmMessage = '';
    this.cdr.markForCheck();
  }

  confirmarEliminarUsuario(): void {
    if (!this.usuarioEditando || this.isDeleting) {
      return;
    }

    this.isDeleting = true;
    this.showDeleteConfirmModal = false;
    this.deleteConfirmMessage = '';

    this.userService.deleteUserById(this.usuarioEditando.id).subscribe({
      next: () => {
        this.isDeleting = false;
        this.cerrarModalEditarUsuario();
        this.cargarUsuarios();
      },
      error: () => {
        this.isDeleting = false;
        this.error = 'No se pudo eliminar el usuario.';
        this.cdr.markForCheck();
      }
    });
  }

  logout(): void {
    this.authService.logout();
    this.router.navigateByUrl('/auth/login');
  }
}