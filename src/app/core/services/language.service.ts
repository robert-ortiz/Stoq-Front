import { Injectable, inject } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';

export type LanguageCode = 'es' | 'en' | 'pt';

interface SupportedLanguage {
  code: LanguageCode;
  labelKey: string;
}

@Injectable({
  providedIn: 'root'
})
export class LanguageService {
  private static readonly STORAGE_KEY = 'stoq_lang';

  private readonly translateService = inject(TranslateService);

  readonly supportedLanguages: SupportedLanguage[] = [
    { code: 'es', labelKey: 'LANGUAGE.ES' },
    { code: 'en', labelKey: 'LANGUAGE.EN' },
    { code: 'pt', labelKey: 'LANGUAGE.PT' }
  ];

  private currentLanguage: LanguageCode = 'es';

  initLanguage(): void {
    const availableCodes = this.supportedLanguages.map((language) => language.code);
    const savedLanguage = this.normalizeLanguage(localStorage.getItem(LanguageService.STORAGE_KEY));
    const browserLanguage = this.normalizeLanguage(this.translateService.getBrowserLang());

    this.translateService.addLangs(availableCodes);
    this.translateService.setFallbackLang('es');

    const initialLanguage = savedLanguage ?? browserLanguage ?? 'es';
    this.setLanguage(initialLanguage);
  }

  getCurrentLanguage(): LanguageCode {
    return this.currentLanguage;
  }

  getCurrentLocale(): string {
    switch (this.currentLanguage) {
      case 'en':
        return 'en-US';
      case 'pt':
        return 'pt-BR';
      default:
        return 'es-ES';
    }
  }

  setLanguage(language: LanguageCode): void {
    const normalizedLanguage = this.normalizeLanguage(language) ?? 'es';
    this.currentLanguage = normalizedLanguage;
    this.translateService.use(normalizedLanguage);
    localStorage.setItem(LanguageService.STORAGE_KEY, normalizedLanguage);
  }

  private normalizeLanguage(language: string | null | undefined): LanguageCode | null {
    if (!language) {
      return null;
    }

    const shortCode = language.toLowerCase().split('-')[0];
    if (shortCode === 'es' || shortCode === 'en' || shortCode === 'pt') {
      return shortCode;
    }

    return null;
  }
}
