import { Component, signal, inject } from '@angular/core';
import { SectionHeaderComponent } from '../../shared/components/section-header/section-header.component';
import { profileData } from '../../core/data/profile.data';
import { FormsModule } from '@angular/forms';
import { TranslationService } from '../../core/services/translation.service';
import { EmailService } from '../../core/services/email.service';

@Component({
  selector: 'app-contact',
  standalone: true,
  imports: [SectionHeaderComponent, FormsModule],
  template: `
    <section id="contact" class="py-20 px-4 sm:px-6 lg:px-8 bg-black text-white">
      <div class="max-w-4xl mx-auto">
        <app-section-header number="04" [title]="t.contact.title" />
        
        <div class="grid grid-cols-1 md:grid-cols-2 gap-12 mb-12">
          <div>
            <h3 class="text-2xl font-bold mb-4">{{ t.contact.workTogether }}</h3>
            <p class="text-white/80 mb-6 leading-relaxed">
              {{ t.contact.description }}
            </p>
            
            <div class="space-y-4">
              @if (profileData.phone) {
                <a 
                  [href]="getWhatsAppUrl()"
                  target="_blank"
                  rel="noopener noreferrer"
                  class="block text-lg font-bold hover:underline focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-black transition-opacity hover:opacity-80"
                  [attr.aria-label]="t.contact.whatsAppLabel + ' ' + profileData.phone"
                >
                  {{ profileData.phone }}
                </a>
              }
              
              <nav [attr.aria-label]="t.contact.socialLinksLabel">
                <ul class="flex flex-wrap gap-4">
                  @for (link of profileData.socialLinks; track link.name) {
                    <li>
                      <a 
                        [href]="link.url"
                        target="_blank"
                        rel="noopener noreferrer"
                        class="text-sm font-medium hover:underline focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-black"
                        [attr.aria-label]="t.contact.visitLabel + ' ' + link.name"
                      >
                        {{ link.name }}
                      </a>
                    </li>
                  }
                </ul>
              </nav>
            </div>
          </div>

          <form 
            (ngSubmit)="onSubmit()"
            class="space-y-6"
            [attr.aria-label]="t.contact.formLabel"
          >
            <div>
              <label 
                for="name"
                class="block text-sm font-bold mb-2"
              >
                {{ t.contact.name }}
              </label>
              <input
                id="name"
                type="text"
                [(ngModel)]="formData.name"
                name="name"
                required
                class="w-full px-4 py-3 bg-white/10 border border-white/20 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-white focus:border-transparent"
                [placeholder]="t.contact.name"
                aria-required="true"
              />
            </div>

            <div>
              <label 
                for="email"
                class="block text-sm font-bold mb-2"
              >
                {{ t.contact.email }}
              </label>
              <input
                id="email"
                type="email"
                [(ngModel)]="formData.email"
                name="email"
                required
                class="w-full px-4 py-3 bg-white/10 border border-white/20 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-white focus:border-transparent"
                [placeholder]="t.contact.emailPlaceholder"
                aria-required="true"
              />
            </div>

            <div>
              <label 
                for="message"
                class="block text-sm font-bold mb-2"
              >
                {{ t.contact.message }}
              </label>
              <textarea
                id="message"
                [(ngModel)]="formData.message"
                name="message"
                required
                rows="5"
                class="w-full px-4 py-3 bg-white/10 border border-white/20 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-white focus:border-transparent resize-none"
                [placeholder]="t.contact.messagePlaceholder"
                aria-required="true"
              ></textarea>
            </div>

            <button
              type="submit"
              [disabled]="isSubmitting()"
              class="w-full px-8 py-3 bg-white text-black font-bold hover:bg-white/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-black"
              [attr.aria-busy]="isSubmitting()"
            >
              @if (isSubmitting()) {
                {{ t.contact.sending }}
              } @else {
                {{ t.contact.sendMessage }}
              }
            </button>

            @if (submitMessage()) {
              <p class="text-sm" [class.text-green-400]="isSuccess()" [class.text-red-400]="!isSuccess()">
                {{ submitMessage() }}
              </p>
            }
          </form>
        </div>
      </div>
    </section>
  `,
  styles: []
})
export class ContactComponent {
  private translationService = inject(TranslationService);
  private emailService = inject(EmailService);
  profileData = profileData;
  isSubmitting = signal(false);
  submitMessage = signal<string | null>(null);
  isSuccess = signal(false);

  formData = {
    name: '',
    email: '',
    message: ''
  };

  get t() {
    return this.translationService.t;
  }

  getWhatsAppUrl(): string {
    let phone = profileData.phone?.replace(/\D/g, '') || '';
    if (phone.startsWith('0')) {
      phone = phone.substring(1);
    }
    const message = encodeURIComponent(this.t.contact.messagePlaceholder);
    return `https://wa.me/593${phone}?text=${message}`;
  }

  async onSubmit(): Promise<void> {
    if (this.isSubmitting()) {
      return;
    }

    // Validar formulario
    if (!this.formData.name || !this.formData.email || !this.formData.message) {
      this.isSuccess.set(false);
      const errorMsg = this.t.contact.name === 'Nombre' 
        ? 'Por favor completa todos los campos' 
        : 'Please fill in all fields';
      this.submitMessage.set(errorMsg);
      setTimeout(() => {
        this.submitMessage.set(null);
      }, 3000);
      return;
    }

    this.isSubmitting.set(true);
    this.submitMessage.set(null);

    try {
      const result = await this.emailService.sendEmail({
        name: this.formData.name,
        email: this.formData.email,
        message: this.formData.message,
      });

      this.isSubmitting.set(false);
      this.isSuccess.set(result.success);
      this.submitMessage.set(result.success ? this.t.contact.success : result.message);

      if (result.success) {
        // Limpiar formulario solo si el envío fue exitoso
        this.formData = {
          name: '',
          email: '',
          message: ''
        };
      }

      // Ocultar mensaje después de 5 segundos
      setTimeout(() => {
        this.submitMessage.set(null);
      }, 5000);
    } catch (error) {
      this.isSubmitting.set(false);
      this.isSuccess.set(false);
      const errorMsg = this.t.contact.name === 'Nombre'
        ? 'Error al enviar el mensaje. Por favor intenta nuevamente.'
        : 'Error sending message. Please try again.';
      this.submitMessage.set(errorMsg);
      setTimeout(() => {
        this.submitMessage.set(null);
      }, 5000);
    }
  }
}
