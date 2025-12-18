import { Component, OnInit, ChangeDetectionStrategy, signal, inject } from '@angular/core';
import { ProjectCardComponent } from './project-card/project-card.component';
import { GithubService } from '../../core/services/github.service';
import { TranslationService } from '../../core/services/translation.service';
import { Project } from '../../core/data/profile.data';

@Component({
  selector: 'app-projects',
  standalone: true,
  imports: [ProjectCardComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section id="projects" class="py-20 px-4 sm:px-6 lg:px-8 bg-white">
      <div class="max-w-7xl mx-auto">
        <!-- Header -->
        <div class="mb-16">
          <h2 class="text-4xl sm:text-5xl font-bold text-black/90 mb-4">
            {{ t.projects.title }}
          </h2>
          <p class="text-lg text-black/70">
            {{ t.projects.subtitle }}
          </p>
        </div>
        
        @if (isLoading()) {
          <div class="flex items-center justify-center py-20">
            <div class="text-center">
              <div class="inline-block w-8 h-8 border-4 border-black border-t-transparent rounded-full animate-spin mb-4" 
                   role="status" 
                   [attr.aria-label]="t.projects.loading">
              </div>
              <p class="text-black/60 font-medium">{{ t.projects.loading }}</p>
            </div>
          </div>
        } @else if (hasError()) {
          <div class="flex items-center justify-center py-20">
            <div class="text-center">
              <p class="text-black/60 font-medium mb-2">{{ t.projects.error }}</p>
              <p class="text-sm text-black/40">{{ t.projects.errorMessage }}</p>
            </div>
          </div>
        } @else if (projects().length === 0) {
          <div class="flex items-center justify-center py-20">
            <p class="text-black/60 font-medium">{{ t.projects.noProjects }}</p>
          </div>
        } @else {
          <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
            @for (project of projects().slice(0, 3); track project.id) {
              <app-project-card [project]="project" />
            }
          </div>
        }
      </div>
    </section>
  `,
  styles: []
})
export class ProjectsComponent implements OnInit {
  private githubService = inject(GithubService);
  private translationService = inject(TranslationService);
  
  projects = signal<Project[]>([]);
  isLoading = signal(true);
  hasError = signal(false);

  get t() {
    return this.translationService.t;
  }

  ngOnInit(): void {
    this.loadProjects();
  }

  private loadProjects(): void {
    this.isLoading.set(true);
    this.hasError.set(false);

    this.githubService.getRepositories().subscribe({
      next: (projects) => {
        this.projects.set(projects);
        this.isLoading.set(false);
        this.hasError.set(false);
      },
      error: (error) => {
        console.error('Error loading projects:', error);
        this.hasError.set(true);
        this.isLoading.set(false);
      }
    });
  }
}
