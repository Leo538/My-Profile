import { ADDITIONAL_PROJECTS } from './additional-projects.data';
import { PROJECT_GALLERIES } from './project-galleries.data';
import { PROJECT_DETAILS } from './project-details.data';

export type MainProjectId = 'finansmart' | 'sicop' | 'chatquality';
export type AdditionalProjectId = 'riego' | 'agropay' | 'rgb' | 'novacore' | 'vinculacion';
export type FeaturedProjectId = 'pantufladas';
export type ProjectId = MainProjectId | AdditionalProjectId | FeaturedProjectId;

export interface ProjectImage {
  url: string;
  alt: string;
  altEn: string;
  caption: string;
  captionEn: string;
}

export interface PortfolioProject {
  id: ProjectId;
  name: string;
  location: string;
  description: string;
  modules?: readonly string[];
  tags: string[];
  imageUrl?: string;
  imageAlt?: string;
  images?: readonly ProjectImage[];
  githubUrl?: string;
  contribution?: string;
  contributionUrl?: string;
  demoUrl?: string;
  videoUrl?: string;
  evidenceNote?: string;
  demoRoute?: string;
  note?: string;
  featured?: boolean;
  repoVisibility?: 'public' | 'private';
}

// Descriptions and technology stacks are documented in each linked repository.
// Personal contributions are omitted where the public sources do not identify them.
const MAIN_PROJECTS: Omit<PortfolioProject, 'description' | 'tags'>[] = [
  {
    id: 'finansmart',
    name: 'FinanSmart',
    location: 'Mirador financiero',
    imageUrl: '/assets/projects/finansmart.png',
    imageAlt: 'Captura original de la portada de FinanSmart, publicada en su repositorio',
  },
  {
    id: 'sicop',
    name: 'SICOP',
    location: 'Archivo de pólizas',
    imageUrl: '/assets/projects/sicop.png',
    imageAlt: 'Captura real del inicio de sesión del frontend público de SICOP',
    evidenceNote:
      'La captura muestra el acceso real de SICOP. El recorrido de revisión de esta ficha utiliza una póliza ficticia.',
  },
  {
    id: 'chatquality',
    name: 'ChatQuality',
    location: 'Torre de comunicaciones',
    imageUrl: '/assets/projects/chatquality.png',
    imageAlt:
      'Interfaz real de ChatQuality con chat y acceso a videollamadas, ejecutada localmente con datos de ejemplo',
    evidenceNote:
      'Captura del proyecto original con alias y mensajes de ejemplo. La reproducción muestra su límite de cinco mensajes por IP en diez segundos.',
  },
];

const TERRACE_LOCATIONS: Record<AdditionalProjectId, string> = {
  riego: 'Invernadero · Terraza 1',
  agropay: 'Mercado · Terraza 1',
  rgb: 'Taller RGB · Terraza 2',
  novacore: 'Estudio de desarrollo · Terraza 2',
  vinculacion: 'Centro de riego conectado · Terraza 1',
};

export const PORTFOLIO_PROJECTS: PortfolioProject[] = [
  ...MAIN_PROJECTS,
  ...ADDITIONAL_PROJECTS.map((project) => ({
    ...project,
    tags: [...project.tags],
    location: TERRACE_LOCATIONS[project.id],
  })),
  {
    id: 'pantufladas' as const,
    name: 'Pantufladas',
    location: 'Cima · Proyecto estrella',
    imageUrl: PROJECT_GALLERIES.pantufladas[0].url,
    imageAlt: PROJECT_GALLERIES.pantufladas[0].alt,
    featured: true,
  },
].map((project) => ({
  ...project,
  ...PROJECT_DETAILS[project.id],
  images: PROJECT_GALLERIES[project.id],
}));
