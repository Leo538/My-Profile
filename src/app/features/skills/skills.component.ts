import { Component, signal, inject } from '@angular/core';
import { SectionHeaderComponent } from '../../shared/components/section-header/section-header.component';
import { profileData, Skill, SkillCategory } from '../../core/data/profile.data';
import { CommonModule } from '@angular/common';
import { TranslationService } from '../../core/services/translation.service';

@Component({
  selector: 'app-skills',
  standalone: true,
  imports: [SectionHeaderComponent, CommonModule],
  template: `
    <section id="skills" class="py-20 px-4 sm:px-6 lg:px-8">
      <div class="max-w-4xl mx-auto">
        <app-section-header number="03" [title]="t.skills.title" />
        
        <div class="mb-8">
          <div class="flex flex-wrap gap-2 border-b-2 border-black">
            @for (category of categories; track category) {
              <button
                (click)="setActiveCategory(category)"
                [class.border-b-2]="activeCategory() === category"
                [class.border-black]="activeCategory() === category"
                [class.font-bold]="activeCategory() === category"
                class="px-4 py-3 text-sm sm:text-base font-medium hover:bg-black/5 transition-colors focus:outline-none focus:ring-2 focus:ring-black focus:ring-offset-2"
                [attr.aria-pressed]="activeCategory() === category"
                [attr.aria-label]="'Mostrar habilidades de ' + getCategoryLabel(category)"
              >
                {{ getCategoryLabel(category) }}
              </button>
            }
          </div>
        </div>

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
    </section>
  `,
  styles: []
})
export class SkillsComponent {
  private translationService = inject(TranslationService);
  profileData = profileData;
  categories: SkillCategory[] = ['frontend', 'backend', 'devops', 'soft'];
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
