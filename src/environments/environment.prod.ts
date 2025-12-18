// Environment configuration for production
// These values will be replaced at build time by Vercel environment variables
// In Vercel, configure these as environment variables with the NG_APP_ prefix

export const environment = {
  production: true,
  emailjs: {
    // Valores por defecto (se sobrescriben en Vercel con variables de entorno)
    // En Vercel, configura estas variables:
    // NG_APP_EMAILJS_PUBLIC_KEY, NG_APP_EMAILJS_SERVICE_ID, etc.
    publicKey: 'hyTv-8T7KhWdh9gwb',
    serviceId: 'service_k7ox0uq',
    templateId: 'template_71ymkwq',
    recipientEmail: 'lozadaleonel15@gmail.com',
  }
};

