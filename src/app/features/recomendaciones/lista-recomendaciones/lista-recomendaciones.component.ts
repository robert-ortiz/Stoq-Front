import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { Router, RouterModule } from '@angular/router';

import {
  RecomendacionAutomaticaApi,
  RecomendacionService
} from '../../../core/services/recomendacion.service';

@Component({
  selector: 'app-lista-recomendaciones',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './lista-recomendaciones.component.html',
  styleUrl: './lista-recomendaciones.component.css'
})
export class ListaRecomendacionesComponent implements OnInit {
  private recomendacionService = inject(RecomendacionService);
  private router = inject(Router);
  private cdr = inject(ChangeDetectorRef);

  recomendaciones: RecomendacionAutomaticaApi[] = [];
  cargando = false;
  error = '';

  ngOnInit(): void {
    this.cargarRecomendaciones();
  }

  cargarRecomendaciones(): void {
    this.cargando = true;
    this.error = '';
    this.cdr.markForCheck();

    this.recomendacionService.getRecomendaciones().subscribe({
      next: (recomendaciones) => {
        console.log('Recomendaciones:', recomendaciones);

        this.recomendaciones = this.ordenarPorPrioridad(recomendaciones ?? []);
        this.cargando = false;
        this.cdr.markForCheck();
      },
      error: (err) => {
        console.error('Error cargando recomendaciones:', err);

        this.error = 'No se pudieron cargar las recomendaciones.';
        this.recomendaciones = [];
        this.cargando = false;
        this.cdr.markForCheck();
      }
    });
  }

  volverAProductos(): void {
    this.router.navigateByUrl('/gerente');
  }

  ordenarPorPrioridad(recomendaciones: RecomendacionAutomaticaApi[]): RecomendacionAutomaticaApi[] {
  const prioridadOrden: Record<string, number> = {
    ALTA: 1,
    MEDIA: 2,
    BAJA: 3
  };

  return [...recomendaciones].sort((a, b) => {
    const prioridadA = prioridadOrden[a.prioridad] ?? 99;
    const prioridadB = prioridadOrden[b.prioridad] ?? 99;

    return prioridadA - prioridadB;
  });
}
}