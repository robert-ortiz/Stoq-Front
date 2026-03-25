import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { RouterModule } from '@angular/router';

@Component({
  selector: '[appFormShell]',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './form-shell.component.html',
  styleUrl: './form-shell.component.css'
})
export class FormShellComponent {
  @Input() title = '';
  @Input() subtitle = '';
  @Input() backLabel = 'VOLVER';
  @Input() backRoute: string | any[] | null = null;
  @Input() showLogo = true;
}
