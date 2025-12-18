import { Component, inject } from '@angular/core';
import { profileData } from '../../core/data/profile.data';
import { TranslationService } from '../../core/services/translation.service';

@Component({
  selector: 'app-about',
  standalone: true,
  imports: [],
  template: `
    <section id="about" class="py-20 px-4 sm:px-6 lg:px-8 bg-white">
      <div class="max-w-7xl mx-auto">
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-start">
          <!-- Columna izquierda: Ilustración (placeholder) -->
          <div class="illustration-container hidden lg:block">
            <div class="illustration-wrapper bg-white rounded-2xl shadow-xl p-8 border border-black/10">
              <div class="illustration-placeholder w-full aspect-square bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg flex items-center justify-center">
                <svg class="w-32 h-32 text-black/20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
                </svg>
              </div>
            </div>
          </div>

          <!-- Columna derecha: Contenido -->
          <div>
            <h2 class="text-4xl sm:text-5xl font-bold text-black/90 mb-4">
              {{ t.about.title }}
            </h2>
            
            <h3 class="text-2xl font-semibold text-black/80 mb-6">
              {{ profileData.name }}
            </h3>
            
            <p class="text-lg leading-relaxed text-black/70 mb-8">
              {{ t.about.bio }}
            </p>

            <!-- Educación -->
            @if (profileData.university) {
              <div class="mb-8">
                <h4 class="text-xl font-bold text-black/90 mb-3">{{ t.about.education }}</h4>
                <div class="space-y-2">
                  <p class="text-base font-semibold text-black/80">{{ profileData.university }}</p>
                  <p class="text-base text-black/70">
                    {{ t.about.roles[0] }}
                  </p>
                  <p class="text-sm text-black/60">{{ t.about.currentlyStudying }}</p>
                </div>
              </div>
            }

            <!-- Experiencia -->
            @if (profileData.experience && profileData.experience.length > 0) {
              <div class="mb-8">
                <h4 class="text-xl font-bold text-black/90 mb-3">{{ t.about.experience }}</h4>
                @for (exp of profileData.experience; track exp.position) {
                  <div class="mb-4">
                    <p class="text-base font-semibold text-black/80">
                      {{ currentLang === 'es' ? exp.position : exp.positionEn }} - {{ exp.company }}
                    </p>
                    <p class="text-sm text-black/70 mt-1">{{ currentLang === 'es' ? exp.description : exp.descriptionEn }}</p>
                    <p class="text-sm text-black/60 mt-1">{{ exp.period }}</p>
                  </div>
                }
              </div>
            }

            <!-- Habilidades Técnicas -->
            @if (technicalSkills.length > 0) {
              <div>
                <h4 class="text-xl font-bold text-black/90 mb-4">{{ t.about.technicalSkills }}</h4>
                <div class="flex flex-wrap gap-3">
                  @for (skill of technicalSkills; track skill.name) {
                    <span class="skill-tag px-4 py-2 bg-gray-100 rounded-lg text-sm font-medium text-black/80 hover:bg-black hover:text-white transition-colors cursor-default">
                      {{ skill.name }}
                    </span>
                  }
                </div>
              </div>
            }
          </div>
        </div>
      </div>
    </section>
  `,
  styles: [`
    .illustration-wrapper {
      position: relative;
      overflow: hidden;
    }
  `]
})
export class AboutComponent {
  private translationService = inject(TranslationService);
  profileData = profileData;

  // Obtener solo habilidades técnicas (frontend, backend, devops)
  get technicalSkills() {
    return this.profileData.skills.filter(
      skill => skill.category !== 'soft'
    );
  }
  
  get t() {
    return this.translationService.t;
  }

  get currentLang() {
    return this.translationService.getCurrentLanguage();
  }
}
