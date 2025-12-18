import { Component, inject } from '@angular/core';
import { profileData } from '../../core/data/profile.data';
import { TranslationService } from '../../core/services/translation.service';

@Component({
  selector: 'app-services',
  standalone: true,
  imports: [],
  template: `
    <section id="services" class="py-20 px-4 sm:px-6 lg:px-8 bg-white">
      <div class="max-w-7xl mx-auto">
        <!-- Header -->
        <div class="text-center mb-16">
          <h2 class="text-4xl sm:text-5xl font-bold text-black/90 mb-4">
            {{ t.services.title }}
          </h2>
          <p class="text-lg text-black/70">
            {{ t.services.subtitle }}
          </p>
        </div>

        <!-- Cards de servicios -->
        @if (profileData.services && profileData.services.length > 0) {
          <div class="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
            @for (service of profileData.services; track service.title; let i = $index) {
              <div class="service-card bg-white rounded-2xl p-8 shadow-lg border border-black/10 hover:shadow-xl transition-shadow">
                <!-- Icono negro -->
                <div class="service-icon mb-6">
                  <div class="w-16 h-16 bg-black rounded-lg flex items-center justify-center">
                    @if (i === 0) {
                      <!-- Icono Desarrollo Web (tabla/estructura) -->
                      <svg class="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"></path>
                      </svg>
                    }
                    @if (i === 1) {
                      <!-- Icono Ingeniería de Software (cubo 3D) -->
                      <svg class="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"></path>
                      </svg>
                    }
                    @if (i === 2) {
                      <!-- Icono Full Stack (grid/conexiones) -->
                      <svg class="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 5a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM14 5a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1V5zM4 15a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1v-4zM14 15a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z"></path>
                      </svg>
                    }
                  </div>
                </div>
                
                <h3 class="text-2xl font-bold text-black/90 mb-4">
                  {{ currentLang === 'es' ? service.title : service.titleEn }}
                </h3>
                
                <p class="text-base text-black/70 leading-relaxed">
                  {{ currentLang === 'es' ? service.description : service.descriptionEn }}
                </p>
              </div>
            }
          </div>
        }

        <!-- Botón CTA -->
        <div class="text-center">
          <a 
            href="#contact"
            class="inline-flex items-center gap-2 px-8 py-4 rounded-lg border-2 border-black font-semibold text-black hover:bg-black hover:text-white transition-colors"
          >
            {{ t.services.hireMe }}
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path>
            </svg>
          </a>
        </div>
      </div>
    </section>
  `,
  styles: [`
    .service-card {
      transition: transform 0.2s ease;
    }

    .service-card:hover {
      transform: translateY(-4px);
    }
  `]
})
export class ServicesComponent {
  private translationService = inject(TranslationService);
  profileData = profileData;

  get t() {
    return this.translationService.t;
  }

  get currentLang() {
    return this.translationService.getCurrentLanguage();
  }
}
