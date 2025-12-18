import { Component, signal, inject } from '@angular/core';
import { SectionHeaderComponent } from '../../shared/components/section-header/section-header.component';
import { profileData, Skill, SkillCategory } from '../../core/data/profile.data';
import { TranslationService } from '../../core/services/translation.service';

@Component({
  selector: 'app-skills',
  standalone: true,
  imports: [SectionHeaderComponent],
  template: `
    <section id="skills" class="py-20 px-4 sm:px-6 lg:px-8">
      <div class="max-w-6xl mx-auto">
        <app-section-header number="03" [title]="t.skills.title" />
        
        <div class="grid grid-cols-1 lg:grid-cols-[200px_1fr] gap-8 lg:gap-12">
          <!-- Categorías verticales a la izquierda -->
          <div class="flex flex-row lg:flex-col gap-2 border-b-2 lg:border-b-0 lg:border-r-2 border-black pb-4 lg:pb-0 lg:pr-4">
            @for (category of categories; track category; let i = $index) {
              <button
                (click)="setActiveCategory(category)"
                [class.bg-black]="activeCategory() === category"
                [class.text-white]="activeCategory() === category"
                [class.text-black]="activeCategory() !== category"
                class="flex items-center gap-2 px-4 py-3 text-sm sm:text-base font-bold transition-colors hover:bg-black hover:text-white focus:outline-none focus:ring-2 focus:ring-black focus:ring-offset-2"
                [attr.aria-pressed]="activeCategory() === category"
                [attr.aria-label]="t.skills.showCategory + ' ' + getCategoryLabel(category)"
              >
                <span [class.text-white/60]="activeCategory() === category" [class.text-black/40]="activeCategory() !== category" class="tabular-nums">{{ (i + 1).toString().padStart(2, '0') }}</span>
                <span>{{ getCategoryLabel(category) }}</span>
              </button>
            }
          </div>

          <!-- Habilidades a la derecha -->
          <div class="space-y-6">
            @for (skill of filteredSkills(); track skill.name) {
              <div>
                <div class="flex justify-between items-center mb-2">
                  <span class="text-lg font-bold">{{ skill.name }}</span>
                  <span class="text-sm text-black/60">{{ skill.level }}%</span>
                </div>
                <div class="h-2 bg-black/10 relative overflow-hidden">
                  <div 
                    class="h-full bg-black transition-all duration-1000 ease-out"
                    [style.width.%]="skill.level"
                    [attr.aria-valuenow]="skill.level"
                    [attr.aria-valuemin]="0"
                    [attr.aria-valuemax]="100"
                    role="progressbar"
                  ></div>
                </div>
              </div>
            }
          </div>
        </div>
      </div>
    </section>
  `,
  styles: []
})
export class SkillsComponent {
  private translationService = inject(TranslationService);
  profileData = profileData;
  categories: SkillCategory[] = ['frontend', 'backend', 'devops'];
  activeCategory = signal<SkillCategory>('frontend');

  get t() {
    return this.translationService.t;
  }

  filteredSkills = signal<Skill[]>(
    this.profileData.skills.filter(skill => skill.category === 'frontend')
  );

  getCategoryLabel(category: SkillCategory): string {
    switch (category) {
      case 'frontend':
        return this.t.skills.frontend;
      case 'backend':
        return this.t.skills.backend;
      case 'devops':
        return this.t.skills.devops;
      case 'soft':
        return this.t.skills.soft;
      default:
        return category;
    }
  }

  setActiveCategory(category: SkillCategory): void {
    this.activeCategory.set(category);
    this.filteredSkills.set(
      this.profileData.skills.filter(skill => skill.category === category)
    );
  }
}
