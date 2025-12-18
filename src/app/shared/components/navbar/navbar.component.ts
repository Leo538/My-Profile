import { Component, inject, PLATFORM_ID, OnInit, OnDestroy, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { isPlatformBrowser } from '@angular/common';
import { TranslationService } from '../../../core/services/translation.service';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule],
  template: `
    <nav class="fixed top-0 left-0 right-0 z-50 bg-transparent">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div class="flex items-center justify-center">
          <!-- Navbar Container -->
          <div class="bg-white rounded-full shadow-lg px-6 py-3 flex items-center gap-4">
            @for (link of navLinks(); track link.id) {
              <a 
                [href]="link.href"
                class="flex items-center gap-2 px-4 py-2 rounded-full transition-colors font-medium text-sm"
                [class.bg-black]="activeSection() === link.id"
                [class.text-white]="activeSection() === link.id"
                [class.text-black/70]="activeSection() !== link.id"
                [class.hover:bg-black]="activeSection() !== link.id"
                [class.hover:text-white]="activeSection() !== link.id"
                (click)="setActiveSection(link.id)"
              >
                <!-- Icono -->
                <span class="w-5 h-5 flex items-center justify-center">
                  @if (link.id === 'home') {
                    <svg fill="none" [attr.stroke]="activeSection() === link.id ? 'white' : 'currentColor'" viewBox="0 0 24 24" class="w-5 h-5">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"></path>
                    </svg>
                  }
                  @if (link.id === 'about') {
                    <svg fill="none" [attr.stroke]="activeSection() === link.id ? 'white' : 'currentColor'" viewBox="0 0 24 24" class="w-5 h-5">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
                    </svg>
                  }
                  @if (link.id === 'projects') {
                    <svg fill="none" [attr.stroke]="activeSection() === link.id ? 'white' : 'currentColor'" viewBox="0 0 24 24" class="w-5 h-5">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"></path>
                    </svg>
                  }
                  @if (link.id === 'services') {
                    <svg fill="none" [attr.stroke]="activeSection() === link.id ? 'white' : 'currentColor'" viewBox="0 0 24 24" class="w-5 h-5">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"></path>
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
                    </svg>
                  }
                </span>
                <!-- Texto -->
                <span>{{ link.label }}</span>
              </a>
            }
            
            <!-- Separador -->
            <div class="w-px h-6 bg-black/20 mx-2"></div>
            
            <!-- Selector de idioma -->
            <div class="flex items-center gap-2">
              <button
                (click)="setLanguage('es')"
                [class.font-bold]="currentLang === 'es'"
                [class.opacity-50]="currentLang !== 'es'"
                class="text-sm px-2 py-1 hover:opacity-100 transition-opacity focus:outline-none focus:ring-2 focus:ring-black focus:ring-offset-2 rounded"
                [attr.aria-label]="'Cambiar a español'"
              >
                ES
              </button>
              <span class="text-black/30">|</span>
              <button
                (click)="setLanguage('en')"
                [class.font-bold]="currentLang === 'en'"
                [class.opacity-50]="currentLang !== 'en'"
                class="text-sm px-2 py-1 hover:opacity-100 transition-opacity focus:outline-none focus:ring-2 focus:ring-black focus:ring-offset-2 rounded"
                [attr.aria-label]="'Switch to English'"
              >
                EN
              </button>
            </div>
          </div>
        </div>
      </div>
    </nav>
  `,
  styles: []
})
export class NavbarComponent implements OnInit, OnDestroy {
  private platformId = inject(PLATFORM_ID);
  private translationService = inject(TranslationService);
  private scrollListener?: () => void;
  activeSection = signal<string>('home');

  get currentLang() {
    return this.translationService.getCurrentLanguage();
  }

  get t() {
    return this.translationService.t;
  }

  navLinks = computed(() => [
    { 
      id: 'home', 
      label: this.t.nav.home, 
      href: '#hero',
    },
    { 
      id: 'about', 
      label: this.t.nav.about, 
      href: '#about',
    },
    { 
      id: 'projects', 
      label: this.t.nav.projects, 
      href: '#projects',
    },
    { 
      id: 'services', 
      label: this.t.nav.services, 
      href: '#services',
    },
  ]);

  ngOnInit(): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }
    this.setupScrollListener();
  }

  ngOnDestroy(): void {
    if (this.scrollListener && isPlatformBrowser(this.platformId)) {
      window.removeEventListener('scroll', this.scrollListener);
    }
  }

  setLanguage(lang: 'es' | 'en'): void {
    this.translationService.setLanguage(lang);
  }

  setActiveSection(id: string): void {
    this.activeSection.set(id);
  }

  private setupScrollListener(): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    this.scrollListener = () => {
      const sections = ['home', 'about', 'projects', 'services'];
      const scrollPosition = window.scrollY + 200;

      for (const section of sections) {
        const element = document.getElementById(section === 'home' ? 'hero' : section);
        if (element) {
          const offsetTop = element.offsetTop;
          const offsetBottom = offsetTop + element.offsetHeight;

          if (scrollPosition >= offsetTop && scrollPosition < offsetBottom) {
            this.activeSection.set(section);
            break;
          }
        }
      }
    };

    window.addEventListener('scroll', this.scrollListener, { passive: true });
  }
}
