import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { profileData } from '../../../core/data/profile.data';
import { TranslationService } from '../../../core/services/translation.service';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule],
  template: `
    <nav class="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-sm border-b border-black/10">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex items-center justify-between h-16">
          <a 
            href="#hero" 
            class="text-xl font-bold tracking-tight hover:opacity-70 transition-opacity focus:outline-none focus:ring-2 focus:ring-black focus:ring-offset-2"
            aria-label="Ir al inicio"
          >
            {{ profileData.name }}
          </a>
          
          <div class="flex items-center gap-6">
            <ul class="hidden md:flex items-center space-x-8">
              @for (link of navLinks; track link.id) {
                <li>
                  <a 
                    [href]="link.href"
                    class="text-sm font-medium hover:underline focus:outline-none focus:ring-2 focus:ring-black focus:ring-offset-2 px-2 py-1"
                    [attr.aria-label]="'Navegar a ' + link.label"
                  >
                    {{ link.label }}
                  </a>
                </li>
              }
            </ul>

            <div class="flex items-center gap-2">
              <button
                (click)="setLanguage('es')"
                [class.font-bold]="currentLang === 'es'"
                [class.opacity-50]="currentLang !== 'es'"
                class="text-sm px-2 py-1 hover:underline focus:outline-none focus:ring-2 focus:ring-black focus:ring-offset-2 transition-opacity"
                aria-label="Cambiar a español"
              >
                ES
              </button>
              <span class="text-black/30">|</span>
              <button
                (click)="setLanguage('en')"
                [class.font-bold]="currentLang === 'en'"
                [class.opacity-50]="currentLang !== 'en'"
                class="text-sm px-2 py-1 hover:underline focus:outline-none focus:ring-2 focus:ring-black focus:ring-offset-2 transition-opacity"
                aria-label="Switch to English"
              >
                EN
              </button>
            </div>

            <button
              (click)="toggleMobileMenu()"
              [attr.aria-expanded]="isMobileMenuOpen"
              aria-label="Alternar menú de navegación"
              class="md:hidden p-2 focus:outline-none focus:ring-2 focus:ring-black"
            >
              <span class="sr-only">Menú</span>
              <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                @if (!isMobileMenuOpen) {
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
                } @else {
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                }
              </svg>
            </button>
          </div>
        </div>

        @if (isMobileMenuOpen) {
          <div class="md:hidden border-t border-black/10 bg-white">
            <ul class="px-4 py-4 space-y-4">
              @for (link of navLinks; track link.id) {
                <li>
                  <a 
                    [href]="link.href"
                    (click)="closeMobileMenu()"
                    class="block text-sm font-medium hover:underline focus:outline-none focus:ring-2 focus:ring-black focus:ring-offset-2 py-2"
                  >
                    {{ link.label }}
                  </a>
                </li>
              }
            </ul>
          </div>
        }
      </div>
    </nav>
  `,
  styles: [`
    :host {
      display: block;
    }
  `]
})
export class NavbarComponent {
  private translationService = inject(TranslationService);
  profileData = profileData;
  isMobileMenuOpen = false;
  
  get currentLang() {
    return this.translationService.getCurrentLanguage();
  }
  
  get t() {
    return this.translationService.t;
  }
  
  get navLinks() {
    return [
      { id: '1', label: this.t.nav.about, href: '#about' },
      { id: '2', label: this.t.nav.projects, href: '#projects' },
      { id: '3', label: this.t.nav.skills, href: '#skills' },
      { id: '4', label: this.t.nav.contact, href: '#contact' },
    ];
  }

  setLanguage(lang: 'es' | 'en'): void {
    this.translationService.setLanguage(lang);
  }

  toggleMobileMenu(): void {
    this.isMobileMenuOpen = !this.isMobileMenuOpen;
  }

  closeMobileMenu(): void {
    this.isMobileMenuOpen = false;
  }
}
