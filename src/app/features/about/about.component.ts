import { Component, inject } from '@angular/core';
import { SectionHeaderComponent } from '../../shared/components/section-header/section-header.component';
import { profileData } from '../../core/data/profile.data';
import { TranslationService } from '../../core/services/translation.service';

@Component({
  selector: 'app-about',
  standalone: true,
  imports: [SectionHeaderComponent],
  template: `
    <section id="about" class="py-20 px-4 sm:px-6 lg:px-8">
      <div class="max-w-4xl mx-auto">
        <app-section-header number="01" [title]="t.about.title" />
        
        <div class="prose prose-lg max-w-none">
          <p class="text-lg sm:text-xl leading-relaxed text-black/80 mb-8">
            {{ profileData.bio }}
          </p>
          
          @if (profileData.aboutSections && profileData.aboutSections.length > 0) {
            <div class="space-y-6">
              @for (section of profileData.aboutSections; track section.title) {
                <div>
                  <h3 class="text-xl sm:text-2xl font-bold mb-2 text-black">
                    {{ section.title }}
                  </h3>
                  <p class="text-base sm:text-lg leading-relaxed text-black/70">
                    {{ section.content }}
                  </p>
                </div>
              }
            </div>
          }
        </div>
      </div>
    </section>
  `,
  styles: []
})
export class AboutComponent {
  private translationService = inject(TranslationService);
  profileData = profileData;
  
  get t() {
    return this.translationService.t;
  }
}
