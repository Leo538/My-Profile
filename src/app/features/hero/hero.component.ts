import { Component, OnInit, OnDestroy, PLATFORM_ID, inject, signal, AfterViewInit, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { isPlatformBrowser } from '@angular/common';
import { profileData } from '../../core/data/profile.data';
import { TranslationService } from '../../core/services/translation.service';
import { gsap } from 'gsap';

@Component({
  selector: 'app-hero',
  standalone: true,
  imports: [CommonModule],
  template: `
    <section 
      #heroSection
      id="hero" 
      class="min-h-screen flex items-center justify-center px-4 sm:px-6 lg:px-8 pt-16 relative overflow-hidden"
      [class.hero-scrolled]="isScrolled()"
    >
      <!-- Gota negra con GSAP -->
      <div 
        #blobElement
        class="absolute w-96 h-96 bg-black pointer-events-none mix-blend-difference z-20 blob-shape"
        [style.left.px]="blobX() - 192"
        [style.top.px]="blobY() - 192"
      ></div>
      
      <div class="max-w-4xl mx-auto text-center relative z-10">
        <h1 
          #nameElement
          class="text-5xl sm:text-6xl lg:text-7xl xl:text-8xl font-black mb-6 leading-tight transition-all duration-1000 hero-text"
          [style.transform]="'translateY(' + nameOffset() + 'px)'"
          [style.opacity]="nameOpacity()"
        >
          {{ profileData.name }}
        </h1>
        
        <div 
          #roleElement
          class="flex flex-wrap justify-center gap-3 mb-8 transition-all duration-1000 delay-100 hero-text"
          [style.transform]="'translateY(' + roleOffset() + 'px)'"
          [style.opacity]="roleOpacity()"
        >
          @for (role of profileData.roles; track role) {
            <span class="text-lg sm:text-xl font-bold px-4 py-2 border-2 border-black hover:bg-black hover:text-white transition-colors cursor-default">
              {{ role }}
            </span>
          }
        </div>

        <p 
          #bioElement
          class="text-lg sm:text-xl text-black/70 max-w-2xl mx-auto mb-12 leading-relaxed transition-all duration-1000 delay-200 hero-text"
          [style.transform]="'translateY(' + bioOffset() + 'px)'"
          [style.opacity]="bioOpacity()"
        >
          {{ profileData.bio }}
        </p>

        <div 
          #buttonsElement
          class="flex flex-wrap justify-center gap-4 transition-all duration-1000 delay-300 hero-text"
          [style.transform]="'translateY(' + buttonsOffset() + 'px)'"
          [style.opacity]="buttonsOpacity()"
        >
          <a 
            href="#projects"
            class="px-8 py-3 bg-black text-white font-bold hover:bg-black/90 transition-all hover:scale-105 focus:outline-none focus:ring-2 focus:ring-black focus:ring-offset-2"
            [attr.aria-label]="t.hero.viewWork"
          >
            {{ t.hero.viewWork }}
          </a>
          <a 
            href="#contact"
            class="px-8 py-3 border-2 border-black font-bold hover:bg-black hover:text-white transition-all hover:scale-105 focus:outline-none focus:ring-2 focus:ring-black focus:ring-offset-2"
            [attr.aria-label]="t.hero.contactMe"
          >
            {{ t.hero.contactMe }}
          </a>
        </div>
      </div>
    </section>
  `,
  styles: [`
    :host {
      display: block;
    }
    
    .hero-scrolled h1 {
      font-size: 3rem !important;
    }
    
    @media (min-width: 640px) {
      .hero-scrolled h1 {
        font-size: 3.5rem !important;
      }
    }
    
    @media (min-width: 1024px) {
      .hero-scrolled h1 {
        font-size: 4rem !important;
      }
    }

    .hero-text {
      transition: color 0.2s ease;
    }

    .blob-shape {
      border-radius: 30% 70% 70% 30% / 30% 30% 70% 70%;
      filter: blur(0px);
    }

    @media (pointer: coarse), (max-width: 767px) {
      .blob-shape {
        display: none;
      }
    }
  `]
})
export class HeroComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('blobElement', { static: false }) blobElement?: ElementRef<HTMLDivElement>;
  @ViewChild('heroSection', { static: false }) heroSection?: ElementRef<HTMLElement>;
  @ViewChild('nameElement', { static: false }) nameElement?: ElementRef<HTMLElement>;
  @ViewChild('roleElement', { static: false }) roleElement?: ElementRef<HTMLElement>;
  @ViewChild('bioElement', { static: false }) bioElement?: ElementRef<HTMLElement>;
  @ViewChild('buttonsElement', { static: false }) buttonsElement?: ElementRef<HTMLElement>;

  private platformId = inject(PLATFORM_ID);
  private translationService = inject(TranslationService);
  private scrollListener?: () => void;
  private mouseListener?: (e: MouseEvent) => void;
  private gsapContext?: gsap.Context;
  
  profileData = profileData;
  isScrolled = signal(false);
  
  // Gota negra
  blobX = signal(0);
  blobY = signal(0);
  
  // Animaciones de entrada
  nameOffset = signal(50);
  nameOpacity = signal(0);
  roleOffset = signal(50);
  roleOpacity = signal(0);
  bioOffset = signal(50);
  bioOpacity = signal(0);
  buttonsOffset = signal(50);
  buttonsOpacity = signal(0);

  get t() {
    return this.translationService.t;
  }

  ngOnInit(): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    this.animateOnLoad();
    this.setupScrollListener();
  }

  ngAfterViewInit(): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    setTimeout(() => {
      this.setupBlobAnimation();
    }, 100);
  }

  ngOnDestroy(): void {
    if (this.scrollListener && isPlatformBrowser(this.platformId)) {
      window.removeEventListener('scroll', this.scrollListener);
    }
    if (this.mouseListener && isPlatformBrowser(this.platformId)) {
      document.removeEventListener('mousemove', this.mouseListener);
    }
    if (this.gsapContext) {
      this.gsapContext.kill();
    }
  }

  private animateOnLoad(): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    setTimeout(() => {
      this.nameOffset.set(0);
      this.nameOpacity.set(1);
    }, 100);

    setTimeout(() => {
      this.roleOffset.set(0);
      this.roleOpacity.set(1);
    }, 200);

    setTimeout(() => {
      this.bioOffset.set(0);
      this.bioOpacity.set(1);
    }, 300);

    setTimeout(() => {
      this.buttonsOffset.set(0);
      this.buttonsOpacity.set(1);
    }, 400);
  }

  private setupBlobAnimation(): void {
    if (!isPlatformBrowser(this.platformId) || !this.blobElement?.nativeElement || !this.heroSection?.nativeElement) {
      return;
    }

    const blob = this.blobElement.nativeElement;
    const hero = this.heroSection.nativeElement;
    
    // Inicializar posición de la gota
    this.blobX.set(window.innerWidth / 2);
    this.blobY.set(window.innerHeight / 2);

    // Crear contexto GSAP
    this.gsapContext = gsap.context(() => {
      // Animación inicial
      gsap.set(blob, {
        x: window.innerWidth / 2 - 192,
        y: window.innerHeight / 2 - 192,
        scale: 0.8,
      });

      // Listener para mover la gota
      this.mouseListener = (e: MouseEvent) => {
        const rect = hero.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        // Usar GSAP para animación suave
        gsap.to(blob, {
          x: x - 192,
          y: y - 192,
          duration: 0.5,
          ease: 'power2.out',
        });

        // Verificar colisión con texto
        this.checkTextCollision(x, y);
      };

      document.addEventListener('mousemove', this.mouseListener, { passive: true });
    });
  }

  private checkTextCollision(blobX: number, blobY: number): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    const elements = [
      this.nameElement?.nativeElement,
      this.roleElement?.nativeElement,
      this.bioElement?.nativeElement,
      this.buttonsElement?.nativeElement,
    ].filter(el => el !== undefined) as HTMLElement[];

    const blobRadius = 192; // Radio de la gota (384px / 2)

    elements.forEach(element => {
      const rect = element.getBoundingClientRect();
      const heroRect = this.heroSection?.nativeElement?.getBoundingClientRect();
      
      if (!heroRect) return;

      // Calcular posición relativa del elemento
      const elementLeft = rect.left - heroRect.left;
      const elementTop = rect.top - heroRect.top;
      const elementRight = elementLeft + rect.width;
      const elementBottom = elementTop + rect.height;

      // Verificar si la gota intersecta con el elemento
      const blobLeft = blobX - blobRadius;
      const blobTop = blobY - blobRadius;
      const blobRight = blobX + blobRadius;
      const blobBottom = blobY + blobRadius;

      const isIntersecting = !(
        blobRight < elementLeft ||
        blobLeft > elementRight ||
        blobBottom < elementTop ||
        blobTop > elementBottom
      );

      if (isIntersecting) {
        gsap.to(element, {
          color: '#ffffff',
          duration: 0.2,
        });
      } else {
        gsap.to(element, {
          color: '',
          duration: 0.2,
        });
      }
    });
  }

  private setupScrollListener(): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    this.scrollListener = () => {
      const scrollY = window.scrollY;
      const heroSection = document.getElementById('hero');
      
      if (heroSection) {
        const heroHeight = heroSection.offsetHeight;
        const scrollProgress = Math.min(scrollY / heroHeight, 1);
        
        this.isScrolled.set(scrollY > 50);
        
        // Efecto parallax sutil
        this.nameOffset.set(scrollProgress * 20);
        this.roleOffset.set(scrollProgress * 15);
        this.bioOffset.set(scrollProgress * 10);
        this.buttonsOffset.set(scrollProgress * 5);
        
        // Opacidad al hacer scroll
        if (scrollY < heroHeight) {
          this.nameOpacity.set(1 - scrollProgress * 0.3);
          this.roleOpacity.set(1 - scrollProgress * 0.2);
          this.bioOpacity.set(1 - scrollProgress * 0.2);
          this.buttonsOpacity.set(1 - scrollProgress * 0.2);
        }
      }
    };

    window.addEventListener('scroll', this.scrollListener, { passive: true });
  }
}
