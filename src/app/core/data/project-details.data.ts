import type { PortfolioProject, ProjectId } from './projects.data';

// Verified against repository code and Leo538 commits; see artifacts/project-details-audit.json.
export const PROJECT_DETAILS: Record<
  ProjectId,
  Omit<PortfolioProject, 'id' | 'name' | 'location' | 'images'>
> = {
  finansmart: {
    description:
      'Plataforma financiera para simular créditos con amortización francesa y alemana, comparar cuotas, proyectar inversiones y exportar resultados en PDF. Incluye solicitudes y seguimiento para clientes, administración de productos y tasas, y verificación documental de identidad.',
    modules: [
      'Simulación y comparación de créditos',
      'Inversiones y solicitudes',
      'Panel de clientes y administración',
      'Identidad y validación documental',
    ],
    contribution:
      'Refactoricé la interfaz y el simulador de créditos, incluida la presentación de resultados y su exportación a PDF.',
    contributionUrl:
      'https://github.com/Leo538/FinanSmart/commit/b84c6ed82ca0beb8f9f494456831fb89a3a83192',
    tags: [
      'Angular 20',
      'TypeScript',
      'C# / ASP.NET Core 9',
      'PostgreSQL',
      'Entity Framework Core',
      'JWT',
      'QuestPDF',
      'Azure Document Intelligence',
      'MediaPipe',
    ],
    githubUrl: 'https://github.com/Leo538/FinanSmart',
  },
  sicop: {
    description:
      'Base full stack de un Sistema de Gestión de Pólizas. Presenta una pantalla de acceso adaptable y una estructura de backend organizada en dominio, aplicación, infraestructura y presentación, preparada para desarrollar los procesos del sistema.',
    modules: [
      'Acceso adaptable a escritorio y móvil',
      'Navegación y modelos TypeScript',
      'Estructura hexagonal del backend',
    ],
    contribution:
      'Implementé la estructura inicial del backend y frontend, los modelos y rutas, y la pantalla de acceso responsive.',
    contributionUrl:
      'https://github.com/Leo538/Proyecto-SICOP/commit/22053543727b34022090aa3b631bd5ec2595b662',
    tags: ['Angular 20', 'TypeScript', 'C# / ASP.NET Core 8', 'RxJS', 'SCSS', 'Swagger / OpenAPI'],
    githubUrl: 'https://github.com/Leo538/Proyecto-SICOP',
  },
  chatquality: {
    description:
      'Aplicación de chat y videollamadas en tiempo real con alias públicos, historial temporal y señalización WebRTC. Valida los mensajes y limita los envíos por IP para controlar el abuso, con pruebas automatizadas y análisis de seguridad.',
    modules: [
      'Chat e historial temporal',
      'Videollamadas y señalización',
      'Validación y límites de envío',
      'Pruebas y análisis de seguridad',
    ],
    contribution:
      'Implementé la versión inicial del chat y las videollamadas, sus validaciones y límites de envío, con pruebas y análisis de seguridad mediante SonarQube.',
    contributionUrl:
      'https://github.com/Leo538/ChatQuality/commit/294c06c95915a7a6afa939a21dc4dd35e5ce8cc8',
    tags: [
      'Angular 22',
      'TypeScript',
      'Node.js / Express 5',
      'Socket.IO',
      'WebRTC',
      'RxJS',
      'Vitest / Jasmine',
      'SonarQube',
    ],
    githubUrl: 'https://github.com/Leo538/ChatQuality',
  },
  riego: {
    description:
      'Simulador de apoyo al riego que estima su duración a partir de la humedad del suelo, la temperatura, la humedad relativa y la radiación PAR. Permite comparar el modelo difuso base con parámetros optimizados mediante un algoritmo genético y exportar un reporte PDF.',
    modules: [
      'Modelo difuso Mamdani de cuatro entradas',
      'Optimización genética y comparación de resultados',
      'Panel de control y visualización del cultivo',
      'Reportes PDF',
    ],
    contribution:
      'Implementé y ajusté los módulos de simulación, optimización genética y panel de control, con una función de aptitud orientada a minimizar errores.',
    contributionUrl:
      'https://github.com/Leo538/Sistema_Riego-IA/commit/00adbfebf0f0715324c62b6b676fb3f0831d7697',
    tags: [
      'Python',
      'Streamlit',
      'NumPy',
      'Matplotlib',
      'ReportLab',
      'Lógica difusa',
      'Algoritmos genéticos',
    ],
    githubUrl: 'https://github.com/Leo538/Sistema_Riego-IA',
  },
  agropay: {
    description:
      'Aplicación que conecta agricultores y compradores para gestionar productos, stock y pedidos. Incluye perfiles por rol, catálogo de mercado, revisión de comprobantes de pago mediante OCR y QR, estados de entrega y alertas de novedades.',
    modules: [
      'Acceso y perfiles de agricultor/comprador',
      'Productos, stock y mercado',
      'Compras, pedidos y entregas',
      'Comprobantes OCR/QR y alertas',
    ],
    contribution:
      'Implementé el flujo de compra y pedidos del comprador y la validación de comprobantes con OCR y QR, incluyendo su revisión por el agricultor.',
    contributionUrl:
      'https://github.com/Leo538/AgroPay/commit/35e05152fdb9657ee99c75da85c8f0201d5611b4',
    tags: [
      'React Native 0.81',
      'Expo 54',
      'React 19',
      'Node.js',
      'Express 4',
      'MongoDB',
      'Mongoose 8',
      'JWT',
      'Tesseract.js',
    ],
    githubUrl: 'https://github.com/Leo538/AgroPay',
  },
  rgb: {
    description:
      'Aplicación de escritorio para analizar y transformar imágenes por canales RGB. Permite ajustar su intensidad, comparar histogramas, aplicar recorte y binarización, y guardar las imágenes resultantes.',
    modules: [
      'Carga y guardado de imágenes',
      'Separación RGB y controles de intensidad',
      'Histogramas y comparación de resultados',
      'Recorte y binarización',
    ],
    contribution:
      'Implementé el editor y el procesamiento de imágenes: separación RGB, controles de intensidad, histogramas, recorte, binarización y guardado de resultados.',
    contributionUrl:
      'https://github.com/Leo538/Laboratorio-rgb/commit/f6f1a14940ddaf80925a34e01169d029fd45d2de',
    tags: ['Python', 'NumPy', 'PySide6', 'OpenCV'],
    githubUrl: 'https://github.com/Leo538/Laboratorio-rgb',
  },
  novacore: {
    description:
      'Sitio web colaborativo para un estudio de software que presenta servicios, proyectos, equipo y blog. Incluye páginas de detalle, componentes reutilizables y una API de publicaciones con almacenamiento PostgreSQL y subida de imágenes.',
    modules: [
      'Portada, servicios y equipo',
      'Catálogo de proyectos y páginas de detalle',
      'Blog y API de publicaciones',
      'Navegación, tarjetas y carruseles',
    ],
    contribution:
      'Desarrollé la sección de proyectos y sus páginas de detalle, integrando rutas, tarjetas reutilizables y ajustes visuales en la interfaz.',
    contributionUrl:
      'https://github.com/Leo538/Novacore/commit/d74ede3f6b8799f4939e029b1945af6146b06848',
    tags: [
      'Angular 20',
      'TypeScript',
      'RxJS',
      'SCSS',
      'Swiper 12',
      'Node.js',
      'Express 4',
      'PostgreSQL',
      'Cloudinary',
    ],
    githubUrl: 'https://github.com/Leo538/Novacore',
  },

  vinculacion: {
    description:
      'Sistema IoT de monitoreo agrícola que reúne lecturas de sensores, clima de Open-Meteo y recomendaciones de riego. Presenta un dashboard con históricos, dispositivos y alertas derivadas de la humedad del suelo y las condiciones meteorológicas.',
    modules: [
      'Dashboard e históricos de sensores',
      'Clima y pronóstico Open-Meteo',
      'Recomendaciones de riego y alertas',
      'API REST, MQTT y actualizaciones WebSocket',
    ],
    contribution:
      'Desarrollé el dashboard y su integración con la API, las tarjetas e históricos de sensores y las alertas calculadas a partir de las lecturas y el clima.',
    contributionUrl:
      'https://github.com/Leo538/Vinculacion-Sistema-Riego/commit/fda96ebfdda520ed6f30f3842359c212cde8c1fe',
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
    githubUrl: 'https://github.com/Leo538/Vinculacion-Sistema-Riego',
  },
  pantufladas: {
    description:
      'Sistema de gestión para una fábrica de pantuflas y sus locales. Integra producción por trabajo realizado, inventario por modelo, talla y color, mercadería en ruta, ventas, reposiciones y gestión laboral y financiera.',
    modules: [
      'Dashboard ejecutivo y alertas operativas',
      'Registro diario, áreas, procesos y tarifas laborales',
      'Bodega, productos, variantes y mercadería en ruta',
      'Ventas, clientes y reposiciones a locales',
      'Sueldos, pagos, caja y reportes financieros',
    ],
    contribution:
      "Trabajé en los catálogos laborales y en el diseño adaptable de producción, inventario y gestión de personal. Preparé el proyecto para producción y actualicé Angular.",
    contributionUrl:
      'https://github.com/Leo538/Pantufladas/commit/32d5c41d010cca6ede543a17970d66d79ee7d099',
    tags: [
      'Angular 20',
      'TypeScript',
      'Tailwind CSS',
      'RxJS',
      'Node.js',
      'Express 4',
      'Prisma 5',
      'PostgreSQL',
      'JWT',
      'Zod',
    ],
    githubUrl: 'https://github.com/Leo538/Pantufladas',
    repoVisibility: 'private',
  },
};

export const PROJECT_DETAILS_EN: Record<ProjectId, Partial<PortfolioProject>> = {
  finansmart: {
    description:
      'A financial platform to simulate French and German amortization loans, compare payments, project investments and export PDF results. It includes customer applications and tracking, product and rate administration, and document-based identity verification.',
    modules: [
      'Loan simulation and comparison',
      'Investments and applications',
      'Customer and administration panels',
      'Identity and document validation',
    ],
    contribution:
      'I refactored the interface and loan simulator, including result presentation and PDF export.',
    tags: [
      'Angular 20',
      'TypeScript',
      'C# / ASP.NET Core 9',
      'PostgreSQL',
      'Entity Framework Core',
      'JWT',
      'QuestPDF',
      'Azure Document Intelligence',
      'MediaPipe',
    ],
  },
  sicop: {
    description:
      "A full-stack foundation for an insurance policy management system. It provides a responsive sign-in screen and a backend organized into domain, application, infrastructure and presentation layers for developing the system's workflows.",
    modules: [
      'Responsive desktop and mobile sign-in',
      'Navigation and TypeScript models',
      'Hexagonal backend structure',
    ],
    contribution:
      'I implemented the initial backend and frontend structure, models and routes, and the responsive sign-in screen.',
    tags: ['Angular 20', 'TypeScript', 'C# / ASP.NET Core 8', 'RxJS', 'SCSS', 'Swagger / OpenAPI'],
  },
  chatquality: {
    description:
      'A real-time chat and video calling application with public aliases, temporary history and WebRTC signaling. It validates messages and limits sends per IP to control abuse, with automated tests and security analysis.',
    modules: [
      'Chat and temporary history',
      'Video calls and signaling',
      'Validation and message limits',
      'Testing and security analysis',
    ],
    contribution:
      'I implemented the initial chat and video calling version, its validation and message limits, with tests and SonarQube security analysis.',
    tags: [
      'Angular 22',
      'TypeScript',
      'Node.js / Express 5',
      'Socket.IO',
      'WebRTC',
      'RxJS',
      'Vitest / Jasmine',
      'SonarQube',
    ],
  },
  riego: {
    description:
      'An irrigation support simulator that estimates duration from soil moisture, temperature, relative humidity and PAR radiation. It compares the base fuzzy model with parameters optimized by a genetic algorithm and exports a PDF report.',
    modules: [
      'Four-input Mamdani fuzzy model',
      'Genetic optimization and result comparison',
      'Control panel and crop visualization',
      'PDF reports',
    ],
    contribution:
      'I implemented and refined the simulation, genetic optimization and control panel modules, including a fitness function focused on minimizing errors.',
    tags: [
      'Python',
      'Streamlit',
      'NumPy',
      'Matplotlib',
      'ReportLab',
      'Fuzzy logic',
      'Genetic algorithms',
    ],
  },
  agropay: {
    description:
      'An application connecting farmers and buyers to manage products, stock and orders. It includes role-based profiles, a marketplace catalog, OCR and QR payment receipt review, delivery states and update alerts.',
    modules: [
      'Sign-in and farmer/buyer profiles',
      'Products, stock and marketplace',
      'Purchases, orders and delivery',
      'OCR/QR receipts and alerts',
    ],
    contribution:
      'I implemented the buyer purchase and order flow and OCR/QR payment receipt validation, including farmer review.',
    tags: [
      'React Native 0.81',
      'Expo 54',
      'React 19',
      'Node.js',
      'Express 4',
      'MongoDB',
      'Mongoose 8',
      'JWT',
      'Tesseract.js',
    ],
  },
  rgb: {
    description:
      'A desktop application for analyzing and transforming images through RGB channels. It adjusts channel intensity, compares histograms, applies cropping and binarization, and saves the resulting images.',
    modules: [
      'Image loading and saving',
      'RGB separation and intensity controls',
      'Histograms and result comparison',
      'Cropping and binarization',
    ],
    contribution:
      'I implemented the editor and image processing: RGB separation, intensity controls, histograms, cropping, binarization and result saving.',
    tags: ['Python', 'NumPy', 'PySide6', 'OpenCV'],
  },
  novacore: {
    description:
      'A collaborative website for a software studio showcasing services, projects, its team and a blog. It includes detail pages, reusable components and a publishing API with PostgreSQL storage and image uploads.',
    modules: [
      'Home page, services and team',
      'Project catalog and detail pages',
      'Blog and publishing API',
      'Navigation, cards and carousels',
    ],
    contribution:
      'I developed the projects section and its detail pages, integrating routes, reusable cards and visual interface refinements.',
    tags: [
      'Angular 20',
      'TypeScript',
      'RxJS',
      'SCSS',
      'Swiper 12',
      'Node.js',
      'Express 4',
      'PostgreSQL',
      'Cloudinary',
    ],
  },

  vinculacion: {
    description:
      'An agricultural IoT monitoring system combining sensor readings, Open-Meteo weather and irrigation recommendations. Its dashboard presents history, devices and alerts derived from soil moisture and weather conditions.',
    modules: [
      'Dashboard and sensor history',
      'Open-Meteo weather and forecast',
      'Irrigation recommendations and alerts',
      'REST API, MQTT and WebSocket updates',
    ],
    contribution:
      'I developed the dashboard and its API integration, sensor cards and history views, and alerts derived from readings and weather.',
  },
  pantufladas: {
    description:
      'A management system for a slipper factory and its stores. It brings together piecework production, inventory by model, size and color, goods in transit, sales, replenishment, and workforce and financial management.',
    modules: [
      'Executive dashboard and operational alerts',
      'Daily work records, areas, processes and labor rates',
      'Warehouse, products, variants and goods in transit',
      'Sales, customers and store replenishment',
      'Payroll, payments, cash management and financial reports',
    ],
    contribution:
      "I worked on labor catalogs and responsive production, inventory and personnel views. I prepared the project for production and updated Angular.",
  },
};
