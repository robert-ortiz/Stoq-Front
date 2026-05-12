import { Component, Input, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-brand',
  standalone: true,
  imports: [CommonModule, TranslateModule],
  template: `
    <a class="brand-link" [ngClass]="cssClass" [attr.aria-label]="ariaLabel || ('HOME.BRAND_ARIA' | translate)" (click)="onClick($event)">
      <img class="brand-icon" src="/Logo.svg" [attr.alt]="ariaLabel || ('HOME.BRAND_ALT' | translate)" [width]="size" [height]="size" />
      <strong class="brand-name">Stoq</strong>
    </a>
  `,
  styles: [
    `
      :host {
        display: inline-flex;
      }

      .brand-link {
        display: inline-flex;
        align-items: center;
        gap: 12px;
        color: #111827;
        text-decoration: none;
        font-weight: 700;
        line-height: 1;
      }

      .brand-icon {
        display: block;
        flex: none;
        object-fit: contain;
        border-radius: 12px;
      }

      .brand-name {
        font-size: 16px;
        font-weight: 700;
        letter-spacing: -0.01em;
      }
    `
  ]
})
export class BrandComponent {
  private router = inject(Router);

  @Input()
  target: string = '/home';

  @Input()
  ariaLabel?: string;

  @Input()
  size = 44;

  @Input()
  cssClass: string = '';

  @Input()
  disabled: boolean = false;

  onClick(event: MouseEvent): void {
    event.preventDefault();

    if (this.disabled) {
      return;
    }

    this.router.navigateByUrl(this.target);
  }
}
