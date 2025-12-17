export interface SocialLink {
  name: string;
  url: string;
  icon?: string;
}

export interface Project {
  id: string;
  title: string;
  description: string;
  tags: string[];
  imageUrl?: string;
  liveUrl?: string;
  githubUrl?: string;
  language?: string;
  updated_at?: string;
}

export type SkillCategory = 'frontend' | 'backend' | 'devops' | 'soft';

export interface Skill {
  name: string;
  level: number; // 0-100
  category: SkillCategory;
}

export interface AboutSection {
  title: string;
  content: string;
}

export interface ProfileData {
  name: string;
  roles: string[];
  bio: string;
  socialLinks: SocialLink[];
  skills: Skill[];
  email?: string;
  phone?: string;
  university?: string;
  aboutSections?: AboutSection[];
}

export const profileData: ProfileData = {
  name: 'Leonel Barros',
  roles: ['Estudiante de Ingeniería de Software'],
  bio: 'Estudiante de Ingeniería de Software enfocado en desarrollo web y buenas prácticas de ingeniería. Interesado en crear soluciones limpias, escalables y orientadas a la experiencia de usuario.',
  phone: '0984426647',
  university: 'Universidad Técnica de Ambato',
  aboutSections: [
    {
      title: 'Estudios',
      content: 'Actualmente cursando la carrera de Ingeniería de Software en la Universidad Técnica de Ambato.',
    },
    {
      title: 'Enfoque',
      content: 'Enfocado en el desarrollo de aplicaciones web modernas utilizando tecnologías como Angular, React y Node.js.',
    },
    {
      title: 'Intereses',
      content: 'Interesado en aprender y aplicar las mejores prácticas de desarrollo, arquitectura de software y metodologías ágiles.',
    },
    {
      title: 'Compromiso',
      content: 'Comprometido con la creación de código limpio, mantenible y escalable.',
    },
  ],
  socialLinks: [
    { name: 'GitHub', url: 'https://github.com/Leo538' },
    { name: 'LinkedIn', url: 'https://www.linkedin.com/in/leonel-barros-75b655264/' },
  ],
  skills: [
    // Frontend
    { name: 'Angular', level: 85, category: 'frontend' },
    { name: 'TypeScript', level: 80, category: 'frontend' },
    { name: 'React', level: 75, category: 'frontend' },
    { name: 'TailwindCSS', level: 85, category: 'frontend' },
    { name: 'HTML/CSS', level: 90, category: 'frontend' },
    { name: 'JavaScript', level: 85, category: 'frontend' },
    
    // Backend
    { name: 'Node.js', level: 75, category: 'backend' },
    { name: 'Java', level: 80, category: 'backend' },
    { name: 'Python', level: 70, category: 'backend' },
    { name: 'REST APIs', level: 80, category: 'backend' },
    { name: 'Spring Boot', level: 70, category: 'backend' },
    // DevOps
    { name: 'Git', level: 85, category: 'devops' },
    { name: 'Docker', level: 65, category: 'devops' },
    { name: 'Linux', level: 70, category: 'devops' },
    // Habilidades blandas
    { name: 'Trabajo en equipo', level: 85, category: 'soft' },
    { name: 'Comunicación', level: 80, category: 'soft' },
    { name: 'Resolución de problemas', level: 85, category: 'soft' },
    { name: 'Adaptabilidad', level: 80, category: 'soft' },
    { name: 'Aprendizaje continuo', level: 90, category: 'soft' },
  ],
};
