import { Injectable, inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

// EmailJS configuration
// IMPORTANTE: Necesitas configurar estos valores después de crear tu cuenta en EmailJS
// 1. Ve a https://www.emailjs.com/
// 2. Crea una cuenta gratuita
// 3. Crea un servicio de email (Gmail, Outlook, etc.)
// 4. Crea una plantilla de email
// 5. Obtén tu Public Key, Service ID y Template ID
// 6. Reemplaza los valores abajo

const EMAILJS_CONFIG = {
  publicKey: 'YOUR_PUBLIC_KEY', // Reemplaza con tu Public Key de EmailJS
  serviceId: 'YOUR_SERVICE_ID', // Reemplaza con tu Service ID
  templateId: 'YOUR_TEMPLATE_ID', // Reemplaza con tu Template ID
  recipientEmail: 'lozadaleonel15@gmail.com', // Tu email de destino
};

export interface EmailData {
  name: string;
  email: string;
  message: string;
}

@Injectable({
  providedIn: 'root'
})
export class EmailService {
  private platformId = inject(PLATFORM_ID);
  private emailjs: any = null;

  constructor() {
    if (isPlatformBrowser(this.platformId)) {
      // Cargar EmailJS dinámicamente
      import('@emailjs/browser').then((emailjs) => {
        this.emailjs = emailjs.default;
        // Inicializar EmailJS con tu Public Key
        this.emailjs.init(EMAILJS_CONFIG.publicKey);
      }).catch((error) => {
        console.error('Error loading EmailJS:', error);
      });
    }
  }

  async sendEmail(data: EmailData): Promise<{ success: boolean; message: string }> {
    if (!isPlatformBrowser(this.platformId)) {
      return { success: false, message: 'Email sending is only available in browser' };
    }

    if (!this.emailjs) {
      return { success: false, message: 'EmailJS is not loaded yet. Please try again.' };
    }

    try {
      const templateParams = {
        from_name: data.name,
        from_email: data.email,
        message: data.message,
        to_email: EMAILJS_CONFIG.recipientEmail,
      };

      const response = await this.emailjs.send(
        EMAILJS_CONFIG.serviceId,
        EMAILJS_CONFIG.templateId,
        templateParams
      );

      if (response.status === 200) {
        return { success: true, message: 'Email sent successfully!' };
      } else {
        return { success: false, message: 'Failed to send email. Please try again.' };
      }
    } catch (error: any) {
      console.error('Error sending email:', error);
      return { 
        success: false, 
        message: error.text || 'An error occurred while sending the email. Please try again.' 
      };
    }
  }
}

