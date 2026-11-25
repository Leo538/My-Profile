import type { AdditionalProjectId } from './projects.data';

export interface AdditionalProject {
  id: AdditionalProjectId;
  name: string;
  description: string;
  imageUrl?: string;
  imageAlt?: string;
  githubUrl?: string;
  tags: string[];
}

export const ADDITIONAL_PROJECTS: readonly AdditionalProject[] = [
  {
    id: 'riego',
    name: 'Sistema de Riego',
    imageUrl: '/assets/projects/riego.png',
    imageAlt: 'Interfaz real del simulador de riego ejecutado con datos de ejemplo',
    description:
      'Recomienda la duración del riego a partir de las condiciones del cultivo, con lógica difusa y un algoritmo genético.',
    githubUrl: 'https://github.com/Leo538/Sistema_Riego-IA',
    tags: ['Python', 'Streamlit', 'Lógica difusa'],
  },
  {
    id: 'agropay',
    name: 'AgroPay',
    imageUrl: '/assets/projects/agropay.png',
    imageAlt: 'Pantalla real de acceso de AgroPay, ejecutada desde su código original',
    description:
      'Aplicación móvil para agricultores y compradores que permite gestionar productos, pedidos y comprobantes de pago.',
    githubUrl: 'https://github.com/Leo538/AgroPay',
    tags: ['React Native', 'Express', 'MongoDB'],
  },
  {
    id: 'rgb',
    name: 'Laboratorio RGB',
    imageUrl: '/assets/projects/rgb.png',
    imageAlt:
      'Editor original de Laboratorio RGB con una imagen de ejemplo y sus controles de color',
    description:
      'Aplicación de escritorio para ajustar los canales RGB de una imagen, comparar histogramas y guardar las imágenes procesadas.',
    githubUrl: 'https://github.com/Leo538/Laboratorio-rgb',
    tags: ['Python', 'OpenCV', 'PySide6'],
  },
  {
    id: 'novacore',
    name: 'Novacore',
    imageUrl: '/assets/projects/novacore.jpg',
    imageAlt: 'Portada real de Novacore ejecutada desde su código original',
    description: 'Proyecto web con una interfaz desarrollada en Angular y TypeScript.',
    githubUrl: 'https://github.com/Leo538/Novacore',
    tags: ['Angular 20', 'TypeScript'],
  },
  {
    id: 'vinculacion',
    name: 'Vinculación de Riego',
    description:
      'Sistema IoT de monitoreo agrícola que reúne lecturas de sensores, clima de Open-Meteo y recomendaciones de riego. Presenta un dashboard con históricos, dispositivos y alertas derivadas de la humedad del suelo y las condiciones meteorológicas.',
    imageUrl: '/assets/projects/vinculacion-dashboard.jpg',
    imageAlt: 'Dashboard original de Vinculación con sensores de ejemplo y clima de Open-Meteo',
    githubUrl: 'https://github.com/Leo538/Vinculacion-Sistema-Riego',
    tags: [
      'Next.js 14',
      'React 18',
      'TypeScript',
      'Tailwind CSS',
      'Recharts',
      'Java 21 / Spring Boot 4',
      'MongoDB',
      'MQTT / Mosquitto',
      'WebSocket / STOMP',
      'ESP32',
      'Open-Meteo',
    ],
  },
];
