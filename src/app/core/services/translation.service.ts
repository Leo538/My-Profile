import { Injectable, signal } from '@angular/core';

export type Language = 'es' | 'en';

export interface Translations {
  nav: {
    about: string;
    projects: string;
    skills: string;
    contact: string;
  };
  hero: {
    viewWork: string;
    contactMe: string;
  };
  about: {
    title: string;
    education: string;
    focus: string;
  };
  projects: {
    title: string;
    loading: string;
    error: string;
    errorMessage: string;
    noProjects: string;
  };
  skills: {
    title: string;
    frontend: string;
    backend: string;
    devops: string;
    soft: string;
  };
  contact: {
    title: string;
    workTogether: string;
    name: string;
    email: string;
    message: string;
    sendMessage: string;
    sending: string;
    success: string;
  };
  footer: {
    rights: string;
  };
  projectCard: {
    liveSite: string;
    sourceCode: string;
  };
}

const translations: Record<Language, Translations> = {
  es: {
    nav: {
      about: 'Acerca de',
      projects: 'Proyectos',
      skills: 'Habilidades',
      contact: 'Contacto',
    },
    hero: {
      viewWork: 'Ver Trabajos',
      contactMe: 'Contáctame',
    },
    about: {
      title: 'Acerca de',
      education: 'Educación',
      focus: 'Enfoque',
    },
    projects: {
      title: 'Proyectos',
      loading: 'Cargando proyectos...',
      error: 'No se pudieron cargar los proyectos',
      errorMessage: 'Por favor verifica tu conexión o intenta más tarde.',
      noProjects: 'No hay proyectos disponibles en este momento.',
    },
    skills: {
      title: 'Habilidades',
      frontend: 'Frontend',
      backend: 'Backend',
      devops: 'DevOps',
      soft: 'Habilidades Blandas',
    },
    contact: {
      title: 'Contacto',
      workTogether: 'Trabajemos juntos',
      name: 'Nombre',
      email: 'Email',
      message: 'Mensaje',
      sendMessage: 'Enviar Mensaje',
      sending: 'Enviando...',
      success: '¡Gracias! Tu mensaje ha sido enviado.',
    },
    footer: {
      rights: 'Todos los derechos reservados.',
    },
    projectCard: {
      liveSite: 'Sitio Web →',
      sourceCode: 'Código Fuente →',
    },
  },
  en: {
    nav: {
      about: 'About',
      projects: 'Projects',
      skills: 'Skills',
      contact: 'Contact',
    },
    hero: {
      viewWork: 'View Work',
      contactMe: 'Get in Touch',
    },
    about: {
      title: 'About',
      education: 'Education',
      focus: 'Focus',
    },
    projects: {
      title: 'Projects',
      loading: 'Loading projects...',
      error: 'Unable to load projects',
      errorMessage: 'Please check your connection or try again later.',
      noProjects: 'No projects available at the moment.',
    },
    skills: {
      title: 'Skills',
      frontend: 'Frontend',
      backend: 'Backend',
      devops: 'DevOps',
      soft: 'Soft Skills',
    },
    contact: {
      title: 'Contact',
      workTogether: "Let's work together",
      name: 'Name',
      email: 'Email',
      message: 'Message',
      sendMessage: 'Send Message',
      sending: 'Sending...',
      success: 'Thank you! Your message has been sent.',
    },
    footer: {
      rights: 'All rights reserved.',
    },
    projectCard: {
      liveSite: 'Live Site →',
      sourceCode: 'Source Code →',
    },
  },
};

@Injectable({
  providedIn: 'root'
})
export class TranslationService {
  private currentLanguage = signal<Language>('es');
  translations = signal<Translations>(translations.es);

  constructor() {
    this.currentLanguage.set('es');
    this.translations.set(translations.es);
  }

  setLanguage(lang: Language): void {
    this.currentLanguage.set(lang);
    this.translations.set(translations[lang]);
  }

  getCurrentLanguage(): Language {
    return this.currentLanguage();
  }

  // Getter para usar en templates
  get t(): Translations {
    return this.translations();
  }
}

