import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { SolicitudReposicionApi, SolicitudReposicionService } from '../../../core/services/solicitud-reposicion.service';

@Component({
  selector: 'app-lista-solicitudes-gerente',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './lista-solicitudes-gerente.component.html',
  styleUrl: './lista-solicitudes-gerente.component.css'
})
export class ListaSolicitudesGerenteComponent implements OnInit {
  private solicitudService = inject(SolicitudReposicionService);
  private router = inject(Router);
  private cdr = inject(ChangeDetectorRef);
  solicitudes: SolicitudReposicionApi[] = [];
  cargando = false;
  error = '';

  estados = ['PENDIENTE', 'APROBADA', 'EN_PROCESO', 'COMPLETADA', 'RECHAZADA'];

  ngOnInit(): void {
    this.cargarSolicitudes();
  }

cargarSolicitudes(): void {
  this.cargando = true;
  this.error = '';

  this.solicitudService.getSolicitudes().subscribe({
    next: (solicitudes) => {
      console.log('Solicitudes recibidas:', solicitudes);

      this.solicitudes = solicitudes ?? [];
      this.cargando = false;
      this.cdr.markForCheck();
    },
    error: (err) => {
      console.error('Error cargando solicitudes:', err);

      this.error = 'No se pudieron cargar las solicitudes.';
      this.solicitudes = [];
      this.cargando = false;
      this.cdr.markForCheck();
    }
  });
}

  cambiarEstado(id: string, estado: string): void {
    this.solicitudService.cambiarEstado(id, estado).subscribe({
      next: () => this.cargarSolicitudes(),
      error: () => {
        this.error = 'No se pudo actualizar el estado.';
      }
    });
  }

  volverAProductos(): void {
    this.router.navigateByUrl('/gerente');
  }
}