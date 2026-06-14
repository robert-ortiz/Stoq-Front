import { AlertaApi } from '../services/alerta.service';
import { NotificationType } from '../services/notification.service';

export function getAlertTitleKey(tipo: string): string {
  switch (tipo) {
    case 'STOCK_CERO':
      return 'NOTIFICATIONS.STOCK_ZERO';
    case 'RIESGO_AGOTAMIENTO':
      return 'NOTIFICATIONS.DEPLETION_RISK';
    case 'CONSUMO_ANORMAL':
      return 'NOTIFICATIONS.ABNORMAL_CONSUMPTION';
    case 'BAJA_ROTACION_PROLONGADA':
      return 'NOTIFICATIONS.LOW_TURNOVER';
    case 'STOCK_BAJO':
    default:
      return 'NOTIFICATIONS.LOW_STOCK';
  }
}

export function getAlertIcon(tipo: string): string {
  switch (tipo) {
    case 'STOCK_CERO':
      return '🛑';
    case 'RIESGO_AGOTAMIENTO':
      return '🚨';
    case 'CONSUMO_ANORMAL':
      return '📈';
    case 'BAJA_ROTACION_PROLONGADA':
      return '📉';
    case 'STOCK_BAJO':
    default:
      return '⚠️';
  }
}

export function getAlertNotificationType(alerta: AlertaApi): NotificationType {
  switch (alerta.tipo) {
    case 'STOCK_CERO':
    case 'RIESGO_AGOTAMIENTO':
    case 'CONSUMO_ANORMAL':
      return 'critical';
    case 'STOCK_BAJO': {
      const stockActual = Number(alerta.stockActual ?? 0);
      const stockMinimo = Number(alerta.stockMinimo ?? 0);
      return stockActual < stockMinimo ? 'critical' : 'warning';
    }
    case 'BAJA_ROTACION_PROLONGADA':
      return 'info';
    default:
      return 'warning';
  }
}
