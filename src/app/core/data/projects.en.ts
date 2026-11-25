import type { PortfolioProject, ProjectId } from './projects.data';
import { PROJECT_DETAILS_EN } from './project-details.data';
import { PROJECT_GALLERIES } from './project-galleries.data';

const PROJECT_LABELS_EN: Record<ProjectId, Partial<PortfolioProject>> = {
  finansmart: {
    location: 'Financial lookout',
    imageAlt: 'Original FinanSmart home page screenshot published in its repository',
  },
  sicop: {
    location: 'Policy archive',
    imageAlt: 'Actual login screen from the public SICOP frontend',
    evidenceNote:
      'The screenshot shows the actual SICOP login. The review activity in this sheet uses a fictional policy.',
  },
  chatquality: {
    location: 'Communications tower',
    imageAlt:
      'Actual ChatQuality interface with chat and video call access, running locally with sample data',
    evidenceNote:
      'Screenshot of the original project with sample aliases and messages. The simulation demonstrates its limit of five messages per IP in ten seconds.',
  },
  riego: {
    imageAlt: 'Actual irrigation simulator interface running with sample inputs',
    location: 'Greenhouse · Terrace 1',
  },
  agropay: {
    imageAlt: 'Actual AgroPay login screen running from its original source code',
    location: 'Market · Terrace 1',
  },
  rgb: {
    imageAlt: 'Original Laboratorio RGB editor with a sample image and its color controls',
    location: 'RGB workshop · Terrace 2',
  },
  novacore: {
    imageAlt: 'Actual Novacore home page running from its original source code',
    location: 'Development studio · Terrace 2',
  },

  vinculacion: {
    name: 'Irrigation IoT',
    location: 'Connected irrigation center · Terrace 1',
    imageAlt: 'Original Vinculación dashboard with sample sensor readings and Open-Meteo weather',
  },
  pantufladas: {
    location: 'Summit · Featured project',
    imageAlt: PROJECT_GALLERIES.pantufladas[0].altEn,
  },
};

export const PROJECTS_EN = Object.fromEntries(
  (Object.keys(PROJECT_LABELS_EN) as ProjectId[]).map((id) => [
    id,
    { ...PROJECT_LABELS_EN[id], ...PROJECT_DETAILS_EN[id] },
  ]),
) as Record<ProjectId, Partial<PortfolioProject>>;
