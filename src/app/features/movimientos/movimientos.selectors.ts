import { MovimientoInventario } from '../../core/services/movimiento.service';

export interface TotalesMovimientos {
  entradas: number;
  salidas: number;
}

export interface ProductoConMovimiento {
  productoId: string;
  productoCodigo: string;
  productoNombre: string;
  totalMovimientos: number;
}

export function calcularTotalesEntradaSalida(movimientos: MovimientoInventario[]): TotalesMovimientos {
  return movimientos.reduce<TotalesMovimientos>(
    (acumulado, item) => {
      const tipo = item.tipoMovimiento.trim().toUpperCase();

      if (tipo === 'ENTRADA') {
        acumulado.entradas += item.cantidad;
      }

      if (tipo === 'SALIDA') {
        acumulado.salidas += item.cantidad;
      }

      return acumulado;
    },
    { entradas: 0, salidas: 0 }
  );
}

export function obtenerProductosConMasMovimiento(
  movimientos: MovimientoInventario[],
  limite = 5
): ProductoConMovimiento[] {
  const agrupados = new Map<string, ProductoConMovimiento>();

  for (const item of movimientos) {
    const existente = agrupados.get(item.productoId);

    if (existente) {
      existente.totalMovimientos += 1;
      continue;
    }

    agrupados.set(item.productoId, {
      productoId: item.productoId,
      productoCodigo: item.productoCodigo,
      productoNombre: item.productoNombre,
      totalMovimientos: 1
    });
  }

  return Array.from(agrupados.values())
    .sort((a, b) => b.totalMovimientos - a.totalMovimientos)
    .slice(0, Math.max(1, limite));
}