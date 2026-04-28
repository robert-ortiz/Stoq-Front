import { Component, OnInit, inject, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { AuthService } from '../../../core/services/auth.service';
import { LanguageCode, LanguageService } from '../../../core/services/language.service';

@Component({
  selector: 'app-lista-reportes',
  standalone: true,
  imports: [CommonModule, RouterModule, TranslateModule],
  templateUrl: './lista-reportes.component.html',
  styleUrl: './lista-reportes.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ListaReportesComponent implements OnInit {
  private authService = inject(AuthService);
  private router = inject(Router);
  private translateService = inject(TranslateService);
  private languageService = inject(LanguageService);

  currentLanguage: LanguageCode = this.languageService.getCurrentLanguage();
  cargando = false;

  ngOnInit(): void {
    this.currentLanguage = this.languageService.getCurrentLanguage();
  }

  onLanguageChange(language: string): void {
    this.languageService.setLanguage(language as LanguageCode);
    this.currentLanguage = this.languageService.getCurrentLanguage();
  }

  goBack(): void {
    this.router.navigateByUrl('/home');
  }

  logout(): void {
    this.authService.logout();
    this.router.navigateByUrl('/auth/login');
  }
}
