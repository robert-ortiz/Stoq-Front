import { Component, ChangeDetectionStrategy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { LanguageCode, LanguageService } from '../../../core/services/language.service';

@Component({
  selector: 'app-public-home',
  standalone: true,
  imports: [CommonModule, RouterModule, TranslateModule],
  templateUrl: './public-home.component.html',
  styleUrl: './public-home.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'home-container'
  }
})
export class PublicHomeComponent {
  private readonly languageService = inject(LanguageService);

  currentLanguage: LanguageCode = this.languageService.getCurrentLanguage();

  readonly availableLanguages = [
    { code: 'es', flag: '🇪🇸', labelKey: 'LANGUAGE.ES' },
    { code: 'en', flag: '🇬🇧', labelKey: 'LANGUAGE.EN' },
    { code: 'pt', flag: '🇵🇹', labelKey: 'LANGUAGE.PT' }
  ];

  onLanguageChange(language: string): void {
    this.languageService.setLanguage(language as LanguageCode);
    this.currentLanguage = this.languageService.getCurrentLanguage();
  }

  get nextLanguageLabel(): string {
    switch (this.currentLanguage) {
      case 'es':
        return 'EN';
      case 'en':
        return 'PT';
      case 'pt':
        return 'ES';
      default:
        return 'EN';
    }
  }
}
