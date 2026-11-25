import { DOCUMENT } from '@angular/common';
import { Injectable, inject, signal } from '@angular/core';

export type PortfolioTheme = 'original' | 'liquid-glass';

const STORAGE_KEY = 'portfolio-theme';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  private readonly document = inject(DOCUMENT);
  private readonly selected = signal<PortfolioTheme>(this.savedTheme());
  readonly theme = this.selected.asReadonly();

  constructor() {
    this.applyTheme(this.theme());
  }

  setTheme(theme: PortfolioTheme): void {
    if (this.theme() === theme) return;
    this.selected.set(theme);
    this.applyTheme(theme);
    try {
      this.document.defaultView?.localStorage.setItem(STORAGE_KEY, theme);
    } catch {
      // The switch still works when storage is unavailable.
    }
  }

  private savedTheme(): PortfolioTheme {
    try {
      return this.document.defaultView?.localStorage.getItem(STORAGE_KEY) === 'liquid-glass'
        ? 'liquid-glass'
        : 'original';
    } catch {
      return 'original';
    }
  }

  private applyTheme(theme: PortfolioTheme): void {
    this.document.documentElement.setAttribute('data-theme', theme);
  }
}
