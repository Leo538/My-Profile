import type { ProjectId, ProjectImage } from './projects.data';

export const PROJECT_GALLERIES: Record<ProjectId, readonly ProjectImage[]> = {
  finansmart: [
    {
      url: '/assets/projects/finansmart.png',
      alt: 'Portada original de FinanSmart publicada en su repositorio',
      altEn: 'Original FinanSmart home page published in its repository',
      caption: 'Portada',
      captionEn: 'Home page',
    },
    {
      url: '/assets/projects/finansmart-herramientas.jpg',
      alt: 'Herramientas reales de FinanSmart para créditos, comparación e inversiones',
      altEn: 'Actual FinanSmart tools for loans, comparisons and investments',
      caption: 'Herramientas financieras',
      captionEn: 'Financial tools',
    },
    {
      url: '/assets/projects/finansmart-analisis.jpg',
      alt: 'Análisis de amortización de la interfaz original de FinanSmart',
      altEn: 'Actual amortization analysis from the original FinanSmart interface',
      caption: 'Análisis de amortización',
      captionEn: 'Amortization analysis',
    },
  ],
  sicop: [
    {
      url: '/assets/projects/sicop.png',
      alt: 'Pantalla real de acceso de SICOP',
      altEn: 'Actual SICOP sign-in screen',
      caption: 'Acceso',
      captionEn: 'Sign in',
    },
    {
      url: '/assets/projects/sicop-movil.jpg',
      alt: 'Pantalla original de acceso de SICOP adaptada a un teléfono',
      altEn: 'Original SICOP sign-in screen adapted to a phone',
      caption: 'Acceso en móvil',
      captionEn: 'Mobile sign in',
    },
  ],
  chatquality: [
    {
      url: '/assets/projects/chatquality.png',
      alt: 'Chat original de ChatQuality con mensajes de ejemplo',
      altEn: 'Original ChatQuality chat with sample messages',
      caption: 'Chat en tiempo real',
      captionEn: 'Real-time chat',
    },
    {
      url: '/assets/projects/chatquality-bienvenida.jpg',
      alt: 'Pantalla original de entrada al chat de ChatQuality',
      altEn: 'Original ChatQuality chat entry screen',
      caption: 'Entrada al chat',
      captionEn: 'Join the chat',
    },
    {
      url: '/assets/projects/chatquality-limite.jpg',
      alt: 'ChatQuality con cinco mensajes aceptados y el sexto bloqueado por su servidor local',
      altEn:
        'Actual ChatQuality with five accepted messages and the sixth blocked by its local server',
      caption: 'Límite de mensajes',
      captionEn: 'Message limit',
    },
  ],
  riego: [
    {
      url: '/assets/projects/riego.png',
      alt: 'Panel original de Sistema de Riego con entradas y funciones de membresía',
      altEn: 'Original Sistema de Riego control panel with inputs and membership functions',
      caption: 'Panel de control',
      captionEn: 'Control panel',
    },
    {
      url: '/assets/projects/riego-cultivo.png',
      alt: 'Vista original de cultivo y sus métricas en Sistema de Riego',
      altEn: 'Original crop view and metrics in Sistema de Riego',
      caption: 'Cultivo y métricas',
      captionEn: 'Crop and metrics',
    },
    {
      url: '/assets/projects/riego-resultado.png',
      alt: 'Resultado original de inferencia de riego con su gráfico y duración de ejemplo',
      altEn: 'Original irrigation inference result with its plot and sample duration',
      caption: 'Resultado del modelo',
      captionEn: 'Model result',
    },
  ],
  agropay: [
    {
      url: '/assets/projects/agropay.png',
      alt: 'Pantalla real de acceso de AgroPay',
      altEn: 'Actual AgroPay sign-in screen',
      caption: 'Acceso',
      captionEn: 'Sign in',
    },
    {
      url: '/assets/projects/agropay-registro.png',
      alt: 'Registro original de AgroPay con perfiles de agricultor y comprador',
      altEn: 'Original AgroPay registration with farmer and buyer profiles',
      caption: 'Registro y perfiles',
      captionEn: 'Registration and profiles',
    },
  ],
  rgb: [
    {
      url: '/assets/projects/rgb.png',
      alt: 'Editor original de Laboratorio RGB con una imagen de ejemplo y sus canales',
      altEn: 'Original Laboratorio RGB editor with a sample image and its channels',
      caption: 'Editor y canales RGB',
      captionEn: 'Editor and RGB channels',
    },
    {
      url: '/assets/projects/rgb-histogramas.png',
      alt: 'Histogramas originales de Laboratorio RGB con canales de color ajustados',
      altEn: 'Original Laboratorio RGB histograms with adjusted color channels',
      caption: 'Histogramas e intensidad',
      captionEn: 'Histograms and intensity',
    },
    {
      url: '/assets/projects/rgb-mascara.png',
      alt: 'Máscara y binarización originales de Laboratorio RGB sobre el paisaje de ejemplo',
      altEn: 'Original Laboratorio RGB mask and binarization on the sample landscape',
      caption: 'Máscara y binarización',
      captionEn: 'Mask and binarization',
    },
  ],
  novacore: [
    {
      url: '/assets/projects/novacore.jpg',
      alt: 'Portada original de Software Studio Novacore',
      altEn: 'Original Software Studio Novacore home page',
      caption: 'Portada',
      captionEn: 'Home page',
    },
    {
      url: '/assets/projects/novacore-servicios.png',
      alt: 'Servicios publicados en la interfaz original de Novacore',
      altEn: 'Original services section published by Novacore',
      caption: 'Servicios del estudio',
      captionEn: 'Studio services',
    },
    {
      url: '/assets/projects/novacore-proyectos.png',
      alt: 'Sección original de proyectos de Novacore',
      altEn: 'Original Novacore projects section',
      caption: 'Proyectos del estudio',
      captionEn: 'Studio projects',
    },
  ],

  vinculacion: [
    {
      url: '/assets/projects/vinculacion-dashboard.jpg',
      alt: 'Dashboard original de Vinculación con sensores de ejemplo y clima de Open-Meteo',
      altEn: 'Original Vinculación dashboard with sample sensor readings and Open-Meteo weather',
      caption: 'Dashboard de monitoreo',
      captionEn: 'Monitoring dashboard',
    },
    {
      url: '/assets/projects/vinculacion-riego.jpg',
      alt: 'Vista original de riego que combina humedad del suelo y probabilidad de lluvia, con lecturas de ejemplo',
      altEn:
        'Original irrigation view combining soil moisture and rainfall probability with sample readings',
      caption: 'Recomendación de riego',
      captionEn: 'Irrigation recommendation',
    },
    {
      url: '/assets/projects/vinculacion-alertas.jpg',
      alt: 'Panel original de alertas derivadas de lecturas IoT de demostración y condiciones meteorológicas',
      altEn: 'Original alerts panel derived from demonstration IoT readings and weather conditions',
      caption: 'Alertas del cultivo',
      captionEn: 'Crop alerts',
    },
  ],
  pantufladas: [
    {
      url: '/assets/projects/pantufladas-login.jpg',
      alt: 'Pantalla de acceso original de Pantufladas, con su logotipo y formulario de inicio de sesión',
      altEn: 'Original Pantufladas sign-in screen with its logo and login form',
      caption: 'Acceso al sistema',
      captionEn: 'System sign-in',
    },
    {
      url: '/assets/projects/pantufladas-dashboard.jpg',
      alt: 'Panel original de Pantufladas con ventas, producción y alertas operativas de ejemplo',
      altEn: 'Original Pantufladas dashboard with sample sales, production and operational alerts',
      caption: 'Dashboard ejecutivo',
      captionEn: 'Executive dashboard',
    },
    {
      url: '/assets/projects/pantufladas-inventario.jpg',
      alt: 'Resumen original de inventario de Pantufladas con pares en bodega, rutas y una tienda de ejemplo',
      altEn:
        'Original Pantufladas inventory summary with warehouse stock, transit stock and a sample store',
      caption: 'Inventario y mercadería en ruta',
      captionEn: 'Inventory and goods in transit',
    },
    {
      url: '/assets/projects/pantufladas-produccion.jpg',
      alt: 'Interfaz original del registro diario de Pantufladas con dos colaboradores ficticios y sus actividades de ejemplo',
      altEn:
        'Original Pantufladas daily work interface with two fictional collaborators and their sample activities',
      caption: 'Registro diario de trabajo',
      captionEn: 'Daily work records',
    },
  ],
};
