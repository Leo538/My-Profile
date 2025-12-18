import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map, catchError, of, forkJoin, switchMap } from 'rxjs';
import { Project } from '../data/profile.data';

export interface GitHubRepo {
  id: number;
  name: string;
  full_name: string;
  description: string | null;
  language: string | null;
  html_url: string;
  fork: boolean;
  updated_at: string;
  homepage: string | null;
  owner: {
    login: string;
  };
}

export interface GitHubEvent {
  repo: {
    id: number;
    name: string;
    url: string;
  };
  type: string;
  created_at: string;
}

@Injectable({
  providedIn: 'root'
})
export class GithubService {
  private http = inject(HttpClient);
  private readonly apiUrl = 'https://api.github.com';
  private readonly username = 'Leo538';
  private readonly maxContributedProjects = 3;
  private readonly maxOwnProjects = 0;
  private readonly totalMaxProjects = 6;

  // Repos específicos que queremos mostrar (3 repos principales)
  private readonly specificRepos = [
    'ArielParedesLozada/Proyecto-Final-Web',
    'ArielParedesLozada/Proyecto-Final-Distribuidas',
    'ArielParedesLozada/ProyectoGPIS',
  ];

  getRepositories(): Observable<Project[]> {
    // Obtener repos propios y repos donde ha contribuido
    return forkJoin({
      ownRepos: this.getOwnRepositories(),
      contributedRepos: this.getContributedRepositories(),
      specificRepos: this.getSpecificRepositories()
    }).pipe(
      map(({ ownRepos, contributedRepos, specificRepos }) => {
        // Combinar todos los proyectos
        const allProjects = [...specificRepos, ...contributedRepos, ...ownRepos];
        
        // Remover duplicados por ID
        const uniqueProjects = Array.from(
          new Map(allProjects.map(p => [p.id, p])).values()
        );
        
        // Ordenar por fecha de actualización y limitar a 6
        return uniqueProjects
          .sort((a, b) => {
            const dateA = a.updated_at ? new Date(a.updated_at).getTime() : 0;
            const dateB = b.updated_at ? new Date(b.updated_at).getTime() : 0;
            return dateB - dateA;
          })
          .slice(0, this.totalMaxProjects);
      }),
      catchError(error => {
        console.error('Error fetching GitHub repositories:', error);
        return of([]);
      })
    );
  }

  private getSpecificRepositories(): Observable<Project[]> {
    const repoDetails$ = this.specificRepos.map(fullName => {
      const url = `${this.apiUrl}/repos/${fullName}`;
      return this.http.get<GitHubRepo>(url).pipe(
        catchError(() => of(null))
      );
    });

    return forkJoin(repoDetails$).pipe(
      map(repos => {
        const validRepos = repos.filter((repo): repo is GitHubRepo => repo !== null);
        return validRepos.map(repo => this.mapRepoToProject(repo));
      }),
      catchError(() => of([]))
    );
  }

  private getOwnRepositories(): Observable<Project[]> {
    const url = `${this.apiUrl}/users/${this.username}/repos?sort=updated&per_page=${this.maxOwnProjects}`;
    
    return this.http.get<GitHubRepo[]>(url).pipe(
      map(repos => {
        return repos
          .filter(repo => !repo.fork)
          .slice(0, this.maxOwnProjects)
          .map(repo => this.mapRepoToProject(repo));
      }),
      catchError(() => of([]))
    );
  }

  private getContributedRepositories(): Observable<Project[]> {
    const eventsUrl = `${this.apiUrl}/users/${this.username}/events/public?per_page=100`;
    
    return this.http.get<GitHubEvent[]>(eventsUrl).pipe(
      map(events => {
        // Extraer repos únicos donde ha contribuido (excluyendo sus propios repos y los específicos)
        const repoMap = new Map<string, { name: string; updated: string }>();
        
        events.forEach(event => {
          if (event.repo && event.repo.name) {
            const [owner] = event.repo.name.split('/');
            const fullName = event.repo.name;
            
            // Solo repos donde NO es el owner y NO está en la lista específica
            if (owner !== this.username && !this.specificRepos.includes(fullName)) {
              const existing = repoMap.get(fullName);
              
              if (!existing || new Date(event.created_at) > new Date(existing.updated)) {
                repoMap.set(fullName, {
                  name: fullName,
                  updated: event.created_at
                });
              }
            }
          }
        });

        return Array.from(repoMap.values())
          .sort((a, b) => new Date(b.updated).getTime() - new Date(a.updated).getTime())
          .slice(0, this.maxContributedProjects)
          .map(item => item.name);
      }),
      switchMap(repoNames => {
        if (repoNames.length === 0) {
          return of([]);
        }

        // Obtener detalles de cada repo
        const repoDetails$ = repoNames.map(fullName => {
          const url = `${this.apiUrl}/repos/${fullName}`;
          return this.http.get<GitHubRepo>(url).pipe(
            catchError(() => of(null))
          );
        });

        return forkJoin(repoDetails$).pipe(
          map(repos => {
            const validRepos = repos.filter((repo): repo is GitHubRepo => repo !== null);
            return validRepos.map(repo => this.mapRepoToProject(repo));
          })
        );
      }),
      catchError(() => of([]))
    );
  }

  private mapRepoToProject(repo: GitHubRepo): Project {
    const tags: string[] = [];

    const repoName = repo.name.toLowerCase();
    const fullName = repo.full_name.toLowerCase();
    
    if (fullName.includes('angular') || repoName.includes('angular')) tags.push('Angular');
    if (fullName.includes('react') || repoName.includes('react')) tags.push('React');
    if (fullName.includes('node') || repoName.includes('node')) tags.push('Node.js');
    if (fullName.includes('java') || repoName.includes('java')) tags.push('Java');
    if (fullName.includes('python') || repoName.includes('python')) tags.push('Python');
    if (fullName.includes('spring') || repoName.includes('spring')) tags.push('Spring Boot');
    if (fullName.includes('typescript') || repoName.includes('typescript')) tags.push('TypeScript');
    if (fullName.includes('javascript') || repoName.includes('javascript')) tags.push('JavaScript');
    if (fullName.includes('html') || repoName.includes('html')) tags.push('HTML');
    if (fullName.includes('c#') || repoName.includes('csharp')) tags.push('C#');
    if (fullName.includes('rxjs') || repoName.includes('rxjs')) tags.push('RxJS');

    // Mejorar descripción si está vacía o es muy genérica
    let description = repo.description || '';
    if (!description || description.trim().length === 0 || 
        description.toLowerCase().includes('sin descripción') ||
        description.toLowerCase().includes('no description')) {
      description = 'Proyecto de desarrollo de software';
    }

    return {
      id: repo.id.toString(),
      title: this.formatRepoName(repo.name),
      description: description,
      tags: tags.length > 0 ? tags : ['Proyecto'],
      githubUrl: repo.html_url,
      liveUrl: repo.homepage || undefined,
      updated_at: repo.updated_at,
    };
  }

  private formatRepoName(name: string): string {
    return name
      .split(/[-_]/)
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }
}
