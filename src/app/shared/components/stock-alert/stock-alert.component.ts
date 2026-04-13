import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslatePipe } from '@ngx-translate/core';
import { ValidacionSalida } from '../../../core/services/movimiento.service';

@Component({
  selector: 'app-stock-alert',
  standalone: true,
  imports: [CommonModule, TranslatePipe],
  template: `
    <div class="stock-validation" [class.valid]="validacion.permitido" [class.invalid]="!validacion.permitido">
      <div class="alert-header">
        <span class="icon" [class.success]="validacion.permitido" [class.error]="!validacion.permitido">
          {{ validacion.permitido ? '✓' : '!' }}
        </span>
        <span class="title">{{ validacion.permitido ? ('STOCK_ALERT.VALID_TITLE' | translate) : ('STOCK_ALERT.INVALID_TITLE' | translate) }}</span>
      </div>

      <div class="alert-body">
        <div class="info-row">
          <span class="info-label">{{ 'STOCK_ALERT.CURRENT_STOCK' | translate }}:</span>
          <span class="info-value">{{ validacion.stockActual }} {{ 'STOCK_ALERT.UNITS' | translate }}</span>
        </div>
        <div class="info-row">
          <span class="info-label">{{ 'STOCK_ALERT.REQUESTED_AMOUNT' | translate }}:</span>
          <span class="info-value">{{ validacion.cantidadSolicitada }} {{ 'STOCK_ALERT.UNITS' | translate }}</span>
        </div>
        <div class="info-row" *ngIf="!validacion.permitido">
          <span class="info-label">{{ 'STOCK_ALERT.DIFFERENCE' | translate }}:</span>
          <span class="info-value error">
            {{ 'STOCK_ALERT.MISSING_UNITS' | translate: { value: (validacion.cantidadSolicitada - validacion.stockActual) } }}
          </span>
        </div>
      </div>

      <div class="alert-message">
        <p>{{ validacion.mensaje }}</p>
      </div>
    </div>
  `,
  styles: `
    .stock-validation {
      padding: 1rem;
      border-radius: 6px;
      border: 2px solid;
      transition: all 0.3s ease;
    }

    .stock-validation.valid {
      border-color: #28a745;
      background-color: #f0fdf4;
    }

    .stock-validation.invalid {
      border-color: #dc3545;
      background-color: #fef2f2;
    }

    .alert-header {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      margin-bottom: 0.75rem;
    }

    .icon {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 24px;
      height: 24px;
      border-radius: 50%;
      font-weight: bold;
      font-size: 1.1rem;
    }

    .icon.success {
      background-color: #28a745;
      color: white;
    }

    .icon.error {
      background-color: #dc3545;
      color: white;
    }

    .title {
      font-weight: 600;
      font-size: 0.95rem;
    }

    .stock-validation.valid .title {
      color: #155724;
    }

    .stock-validation.invalid .title {
      color: #721c24;
    }

    .alert-body {
      margin-bottom: 0.75rem;
      padding: 0.75rem 0;
      border-top: 1px solid;
      border-bottom: 1px solid;
    }

    .stock-validation.valid .alert-body {
      border-color: rgba(40, 167, 69, 0.2);
    }

    .stock-validation.invalid .alert-body {
      border-color: rgba(220, 53, 69, 0.2);
    }

    .info-row {
      display: flex;
      justify-content: space-between;
      padding: 0.5rem 0;
      font-size: 0.9rem;
    }

    .info-label {
      font-weight: 500;
      color: #555;
    }

    .info-value {
      font-weight: 600;
    }

    .stock-validation.valid .info-value {
      color: #28a745;
    }

    .stock-validation.invalid .info-value {
      color: #dc3545;
    }

    .info-value.error {
      color: #dc3545 !important;
    }

    .alert-message {
      margin: 0;
      padding: 0;
    }

    .alert-message p {
      margin: 0;
      font-size: 0.9rem;
      font-weight: 500;
    }

    .stock-validation.valid .alert-message p {
      color: #155724;
    }

    .stock-validation.invalid .alert-message p {
      color: #721c24;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class StockAlertComponent {
  @Input() validacion!: ValidacionSalida;
}
