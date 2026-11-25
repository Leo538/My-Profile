import { Injectable, inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { environment } from '../../../environments/environment';

export interface EmailData {
  name: string;
  email: string;
  message: string;
}

@Injectable({
  providedIn: 'root',
})
export class EmailService {
  private readonly platformId = inject(PLATFORM_ID);
  readonly recipient = environment.emailjs.recipientEmail;

  async sendEmail(data: EmailData): Promise<{ success: boolean; message: string }> {
    if (!isPlatformBrowser(this.platformId)) {
      return { success: false, message: 'Email sending is only available in browser' };
    }

    try {
      const { default: emailjs } = await import('@emailjs/browser');
      const { serviceId, templateId, publicKey } = environment.emailjs;
      const name = data.name.trim();
      const email = data.email.trim();
      const message = data.message.trim();
      const time = new Date().toLocaleString('es-EC', { timeZone: 'America/Guayaquil' });
      const templateParams = {
        name,
        nombre: name,
        email,
        correo: email,
        reply_to: email,
        message,
        mensaje: message,
        title: 'Contacto desde el portafolio',
        time,
        tiempo: time,
      };

      const response = await emailjs.send(serviceId, templateId, templateParams, { publicKey });

      if (response.status === 200) {
        return { success: true, message: 'Email sent successfully!' };
      } else {
        return { success: false, message: 'Failed to send email. Please try again.' };
      }
    } catch {
      return { success: false, message: 'Failed to send email. Please try again.' };
    }
  }
}
