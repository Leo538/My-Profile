import { Component, Input, inject } from '@angular/core';
import { Project } from '../../../core/data/profile.data';
import { TranslationService } from '../../../core/services/translation.service';

@Component({
  selector: 'app-project-card',
  standalone: true,
  imports: [],
  template: `
    <article 
      class="group border-2 border-black p-6 sm:p-8 hover:translate-x-1 hover:translate-y-1 transition-transform duration-300 focus-within:ring-2 focus-within:ring-black focus-within:ring-offset-2"
      [style.userSelect]="'none'"
    >
      <div class="mb-4">
        <h3 class="text-2xl sm:text-3xl font-bold mb-3 group-hover:underline">
          {{ project.title }}
        </h3>
        <p class="text-black/70 text-lg leading-relaxed mb-4 select-none">
          {{ project.description }}
        </p>
      </div>

      <div class="flex flex-wrap gap-2 mb-6">
        @for (tag of project.tags; track tag) {
          <span class="px-3 py-1 text-sm font-medium border border-black/20">
            {{ tag }}
          </span>
        }
      </div>

      <div class="flex flex-wrap gap-4">
        @if (project.liveUrl) {
          <a 
            [href]="project.liveUrl"
            target="_blank"
            rel="noopener noreferrer"
            class="text-sm font-bold hover:underline focus:outline-none focus:ring-2 focus:ring-black focus:ring-offset-2"
            [attr.aria-label]="'Visitar sitio en vivo de ' + project.title"
          >
            {{ t.projectCard.liveSite }}
          </a>
        }
        @if (project.githubUrl) {
          <a 
            [href]="project.githubUrl"
            target="_blank"
            rel="noopener noreferrer"
            class="text-sm font-bold hover:underline focus:outline-none focus:ring-2 focus:ring-black focus:ring-offset-2"
            [attr.aria-label]="'Ver código fuente de ' + project.title"
          >
            {{ t.projectCard.sourceCode }}
          </a>
        }
      </div>
    </article>
  `,
  styles: [`
    :host {
      -webkit-user-select: none;
      -moz-user-select: none;
      -ms-user-select: none;
      user-select: none;
      display: block;
      height: 100%;
    }
    
    article {
      height: 100%;
      display: flex;
      flex-direction: column;
    }
  `]
})
export class ProjectCardComponent {
  private translationService = inject(TranslationService);
  @Input({ required: true }) project!: Project;
  
  get t() {
    return this.translationService.t;
  }
}
