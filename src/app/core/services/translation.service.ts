import { Injectable, signal } from '@angular/core';

export type Language = 'es' | 'en';

export interface Translations {
    nav: {
      home: string;
      about: string;
      projects: string;
      services: string;
      contact: string;
    };
    hero: {
      greeting: string;
      viewWork: string;
      contactMe: string;
      hire: string;
      followMe: string;
      roles: string[];
    };
    services: {
      title: string;
      subtitle: string;
      hireMe: string;
    };
  about: {
    title: string;
    label: string;
    bio: string;
    roles: string[];
    sections: Array<{ title: string; content: string }>;
    education: string;
    currentlyStudying: string;
    experience: string;
    technicalSkills: string;
  };
  projects: {
    title: string;
    subtitle: string;
    label: string;
    loading: string;
    error: string;
    errorMessage: string;
    noProjects: string;
  };
  skills: {
    title: string;
    label: string;
    frontend: string;
    backend: string;
    devops: string;
    soft: string;
    showCategory: string;
  };
  contact: {
    title: string;
    label: string;
    workTogether: string;
    description: string;
    name: string;
    email: string;
    emailPlaceholder: string;
    message: string;
    messagePlaceholder: string;
    sendMessage: string;
    sending: string;
    success: string;
    whatsAppLabel: string;
    socialLinksLabel: string;
    formLabel: string;
    visitLabel: string;
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
      home: 'Inicio',
      about: 'Acerca',
      projects: 'Proyectos',
      services: 'Servicios',
      contact: 'Contacto',
    },
    hero: {
      greeting: 'Hola, soy',
      viewWork: 'Ver Trabajos',
      contactMe: 'Contáctame',
      hire: 'Contratar',
      followMe: 'Sígueme',
      roles: ['Estudiante de Ingeniería de Software', 'Desarrollador Web', 'Full Stack Developer'],
    },
    services: {
      title: 'Mis Servicios',
      subtitle: 'Lo que puedo hacer por ti',
      hireMe: 'Contrátame',
    },
    about: {
      title: 'Acerca de Mí',
      label: '01 — ACERCA DE',
      bio: 'Estudiante de Ingeniería de Software enfocado en desarrollo web y buenas prácticas de ingeniería. Interesado en crear soluciones limpias, escalables y orientadas a la experiencia de usuario.',
      roles: ['Estudiante de Ingeniería de Software'],
      sections: [
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
      education: 'Educación',
      currentlyStudying: 'Actualmente estudiando',
      experience: 'Experiencia',
      technicalSkills: 'Habilidades Técnicas',
    },
    projects: {
      title: 'Proyectos',
      subtitle: 'Algunos de los proyectos en los que he trabajado',
      label: '02 — PROYECTOS DESTACADOS',
      loading: 'Cargando proyectos...',
      error: 'No se pudieron cargar los proyectos',
      errorMessage: 'Por favor verifica tu conexión o intenta más tarde.',
      noProjects: 'No hay proyectos disponibles en este momento.',
    },
    skills: {
      title: 'Habilidades',
      label: '03 — HABILIDADES TÉCNICAS',
      frontend: 'Frontend',
      backend: 'Backend',
      devops: 'DevOps',
      soft: 'Habilidades Blandas',
      showCategory: 'Mostrar habilidades de',
    },
    contact: {
      title: 'Contacto',
      label: '04 — CONTACTO',
      workTogether: 'Trabajemos juntos',
      description: 'Siempre estoy abierto a discutir nuevos proyectos, ideas creativas u oportunidades para ser parte de tus visiones.',
      name: 'Nombre',
      email: 'Email',
      emailPlaceholder: 'tu.email@ejemplo.com',
      message: 'Mensaje',
      messagePlaceholder: 'Cuéntame sobre tu proyecto...',
      sendMessage: 'Enviar Mensaje',
      sending: 'Enviando...',
      success: '¡Gracias! Tu mensaje ha sido enviado.',
      whatsAppLabel: 'Contactar por WhatsApp:',
      socialLinksLabel: 'Enlaces sociales',
      formLabel: 'Formulario de contacto',
      visitLabel: 'Visitar',
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
      home: 'Home',
      about: 'About',
      projects: 'Projects',
      services: 'Services',
      contact: 'Contact',
    },
    hero: {
      greeting: 'Hello, I am',
      viewWork: 'View Work',
      contactMe: 'Get in Touch',
      hire: 'Hire Me',
      followMe: 'Follow Me',
      roles: ['Software Engineering Student', 'Web Developer', 'Full Stack Developer'],
    },
    services: {
      title: 'My Services',
      subtitle: 'What I can do for you',
      hireMe: 'Hire Me',
    },
    about: {
      title: 'About Me',
      label: '01 — ABOUT',
      bio: 'Software Engineering student focused on web development and good engineering practices. Interested in creating clean, scalable, and user experience-oriented solutions.',
      roles: ['Software Engineering Student'],
      sections: [
        {
          title: 'Education',
          content: 'Currently pursuing a degree in Software Engineering at the Technical University of Ambato.',
        },
        {
          title: 'Focus',
          content: 'Focused on developing modern web applications using technologies such as Angular, React, and Node.js.',
        },
        {
          title: 'Interests',
          content: 'Interested in learning and applying best development practices, software architecture, and agile methodologies.',
        },
        {
          title: 'Commitment',
          content: 'Committed to creating clean, maintainable, and scalable code.',
        },
      ],
      education: 'Education',
      currentlyStudying: 'Currently studying',
      experience: 'Experience',
      technicalSkills: 'Technical Skills',
    },
    projects: {
      title: 'Projects',
      subtitle: 'Some of the projects I have worked on',
      label: '02 — FEATURED PROJECTS',
      loading: 'Loading projects...',
      error: 'Unable to load projects',
      errorMessage: 'Please check your connection or try again later.',
      noProjects: 'No projects available at the moment.',
    },
    skills: {
      title: 'Skills',
      label: '03 — TECHNICAL SKILLS',
      frontend: 'Frontend',
      backend: 'Backend',
      devops: 'DevOps',
      soft: 'Soft Skills',
      showCategory: 'Show skills for',
    },
    contact: {
      title: 'Contact',
      label: '04 — CONTACT',
      workTogether: "Let's work together",
      description: 'I am always open to discussing new projects, creative ideas or opportunities to be part of your visions.',
      name: 'Name',
      email: 'Email',
      emailPlaceholder: 'your.email@example.com',
      message: 'Message',
      messagePlaceholder: 'Tell me about your project...',
      sendMessage: 'Send Message',
      sending: 'Sending...',
      success: 'Thank you! Your message has been sent.',
      whatsAppLabel: 'Contact via WhatsApp:',
      socialLinksLabel: 'Social links',
      formLabel: 'Contact form',
      visitLabel: 'Visit',
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

