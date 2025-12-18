import { Directive, ElementRef, Input, OnInit, PLATFORM_ID, inject, OnDestroy } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

/**
 * Directiva que aplica una animación de escritura (typing) al texto.
 * Soporta múltiples textos que se escriben secuencialmente.
 */
@Directive({
  selector: '[typingAnimation]',
  standalone: true,
})
export class TypingAnimationDirective implements OnInit, OnDestroy {
  @Input() texts: string[] = [];
  @Input() text = ''; // Fallback para un solo texto
  @Input() speed = 100; // Velocidad en ms por carácter
  @Input() delay = 0; // Delay inicial en ms
  @Input() loop = true; // Si debe repetir la animación
  @Input() deleteSpeed = 50; // Velocidad de borrado
  @Input() pauseBetween = 2000; // Pausa entre textos

  private platformId = inject(PLATFORM_ID);
  private currentText = '';
  private currentIndex = 0;
  private currentTextIndex = 0;
  private timeoutId: number | null = null;
  private isDestroyed = false;
  private isDeleting = false;

  constructor(private el: ElementRef<HTMLElement>) {}

  ngOnInit(): void {
    if (!isPlatformBrowser(this.platformId)) {
      const texts = this.texts.length > 0 ? this.texts : [this.text];
      this.el.nativeElement.textContent = texts[0] || '';
      return;
    }

    setTimeout(() => {
      if (!this.isDestroyed) {
        this.startTyping();
      }
    }, this.delay);
  }

  ngOnDestroy(): void {
    this.isDestroyed = true;
    if (this.timeoutId !== null) {
      clearTimeout(this.timeoutId);
    }
  }

  private startTyping(): void {
    if (this.isDestroyed) return;

    const texts = this.texts.length > 0 ? this.texts : [this.text];
    if (texts.length === 0) return;

    const targetText = texts[this.currentTextIndex];

    if (!this.isDeleting) {
      // Escribiendo
      if (this.currentIndex < targetText.length) {
        this.currentText += targetText.charAt(this.currentIndex);
        this.el.nativeElement.textContent = this.currentText + '|';
        this.currentIndex++;
        this.timeoutId = window.setTimeout(() => this.startTyping(), this.speed);
      } else {
        // Terminó de escribir, esperar antes de borrar
        this.el.nativeElement.textContent = this.currentText; // Quitar cursor
        this.timeoutId = window.setTimeout(() => {
          this.isDeleting = true;
          this.startTyping();
        }, this.pauseBetween);
      }
    } else {
      // Borrando
      if (this.currentText.length > 0) {
        this.currentText = this.currentText.slice(0, -1);
        this.el.nativeElement.textContent = this.currentText + '|';
        this.timeoutId = window.setTimeout(() => this.startTyping(), this.deleteSpeed);
      } else {
        // Terminó de borrar, pasar al siguiente texto
        this.isDeleting = false;
        this.currentIndex = 0;
        this.currentTextIndex = (this.currentTextIndex + 1) % texts.length;
        
        if (!this.loop && this.currentTextIndex === 0) {
          // Si no es loop y volvió al inicio, mantener el último texto
          this.el.nativeElement.textContent = texts[texts.length - 1] || '';
          return;
        }
        
        this.timeoutId = window.setTimeout(() => this.startTyping(), 100);
      }
    }
  }
}
