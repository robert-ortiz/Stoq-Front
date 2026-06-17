import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import {
  SolicitudReposicionApi,
  SolicitudReposicionService
} from '../../../core/services/solicitud-reposicion.service';

@Component({
  selector: 'app-lista-solicitudes-operador',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './lista-solicitudes-operador.component.html',
  styleUrl: './lista-solicitudes-operador.component.css'
})
export class ListaSolicitudesOperadorComponent implements OnInit {
  private solicitudService = inject(SolicitudReposicionService);
  private router = inject(Router);
  private cdr = inject(ChangeDetectorRef);

  solicitudes: SolicitudReposicionApi[] = [];
  cargando = false;
  error = '';

  ngOnInit(): void {
    this.cargarSolicitudes();
  }

  cargarSolicitudes(): void {
    this.cargando = true;
    this.error = '';
    this.cdr.markForCheck();

    this.solicitudService.getSolicitudes().subscribe({
      next: (solicitudes) => {
        this.solicitudes = solicitudes ?? [];
        this.cargando = false;
        this.cdr.markForCheck();
      },
      error: () => {
        this.error = 'No se pudieron cargar las solicitudes.';
        this.solicitudes = [];
        this.cargando = false;
        this.cdr.markForCheck();
      }
    });
  }

  volverAProductos(): void {
    this.router.navigateByUrl('/operador');
  }
}