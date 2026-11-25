import { DOCUMENT } from '@angular/common';
import { Injectable, computed, inject, signal } from '@angular/core';

export type Language = 'es' | 'en';

@Injectable({ providedIn: 'root' })
export class LanguageService {
  private readonly document = inject(DOCUMENT);
  readonly lang = signal<Language>(this.savedLanguage());
  readonly locale = computed(() => (this.lang() === 'es' ? 'es-EC' : 'en-US'));

  constructor() {
    this.updateDocument();
  }

  text(es: string, en: string): string {
    return this.lang() === 'es' ? es : en;
  }

  setLanguage(language: Language): void {
    this.lang.set(language);
    try {
      this.document.defaultView?.localStorage.setItem('portfolio-language', language);
    } catch {
      // Language switching also works when browser storage is unavailable.
    }
    this.updateDocument();
  }

  private savedLanguage(): Language {
    try {
      return this.document.defaultView?.localStorage.getItem('portfolio-language') === 'en'
        ? 'en'
        : 'es';
    } catch {
      return 'es';
    }
  }

  private updateDocument(): void {
    this.document.documentElement.lang = this.lang();
    this.document.title = this.text(
      'Leonel Barros · Desarrollador de software',
      'Leonel Barros · Software developer',
    );
  }
}
