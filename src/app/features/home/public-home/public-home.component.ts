import { Component, ChangeDetectionStrategy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

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
  private readonly translateService = inject(TranslateService);

  currentLanguage = this.translateService.currentLang || this.translateService.defaultLang || localStorage.getItem('language') || 'es';

  readonly availableLanguages = [
    { code: 'es', flag: '🇪🇸', labelKey: 'LANGUAGE.ES' },
    { code: 'en', flag: '🇬🇧', labelKey: 'LANGUAGE.EN' },
    { code: 'pt', flag: '🇵🇹', labelKey: 'LANGUAGE.PT' }
  ];

  onLanguageChange(language: string): void {
    this.currentLanguage = language;
    this.translateService.use(language);
    localStorage.setItem('language', language);
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
