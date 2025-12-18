import { Component, OnInit, PLATFORM_ID, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { isPlatformBrowser } from '@angular/common';

@Component({
  selector: 'app-welcome',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div 
      class="welcome-screen fixed inset-0 bg-black z-[100] flex items-center justify-center transition-opacity duration-1000"
      [class.opacity-0]="isHidden()"
      [class.pointer-events-none]="isHidden()"
    >
      <!-- Grid de fondo -->
      <div class="absolute inset-0 opacity-20">
        <div class="grid-pattern"></div>
      </div>
      
      <!-- Formas geométricas de fondo -->
      <div class="absolute inset-0 overflow-hidden">
        <div class="geometric-shape shape-1"></div>
        <div class="geometric-shape shape-2"></div>
        <div class="geometric-shape shape-3"></div>
        <div class="geometric-shape shape-4"></div>
      </div>

      <!-- Contenido central -->
      <div class="relative z-10 text-center">
        <h1 class="welcome-title text-white text-6xl sm:text-7xl lg:text-8xl font-bold mb-8">
          Bienvenido
        </h1>
        
        <!-- Botón play (opcional) -->
        <div class="play-button-wrapper mb-8">
          <div class="play-button"></div>
        </div>

        <!-- Barra de carga -->
        <div class="loading-section">
          <div class="loading-bar-container">
            <div 
              class="loading-bar"
              [style.width.%]="loadingProgress()"
            ></div>
          </div>
          <div class="flex items-center justify-center gap-2 mt-2">
            <span class="text-white/60 text-sm font-medium">CARGANDO</span>
            <span class="loading-dots">
              <span class="dot" [class.animate]="loadingProgress() > 0"></span>
              <span class="dot" [class.animate]="loadingProgress() > 33"></span>
              <span class="dot" [class.animate]="loadingProgress() > 66"></span>
            </span>
            <span class="text-white/60 text-sm font-medium">{{ loadingProgress() }}%</span>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .welcome-screen {
      background: #000;
    }

    .grid-pattern {
      width: 100%;
      height: 100%;
      background-image: 
        linear-gradient(rgba(255, 255, 255, 0.1) 1px, transparent 1px),
        linear-gradient(90deg, rgba(255, 255, 255, 0.1) 1px, transparent 1px);
      background-size: 50px 50px;
    }

    .geometric-shape {
      position: absolute;
      border: 1px solid rgba(255, 255, 255, 0.1);
      opacity: 0.3;
    }

    .shape-1 {
      top: 10%;
      left: 10%;
      width: 60px;
      height: 60px;
      transform: rotate(45deg);
    }

    .shape-2 {
      top: 30%;
      left: 5%;
      width: 40px;
      height: 40px;
      transform: rotate(45deg);
    }

    .shape-3 {
      bottom: 20%;
      right: 10%;
      width: 50px;
      height: 50px;
      border-radius: 50%;
    }

    .shape-4 {
      bottom: 10%;
      right: 5%;
      width: 80px;
      height: 80px;
      transform: rotate(45deg);
    }

    .welcome-title {
      text-shadow: 0 0 20px rgba(255, 255, 255, 0.3);
    }

    .play-button-wrapper {
      display: flex;
      justify-content: center;
      align-items: center;
    }

    .play-button {
      width: 60px;
      height: 60px;
      border: 2px solid white;
      border-radius: 50%;
      position: relative;
      cursor: pointer;
    }

    .play-button::after {
      content: '';
      position: absolute;
      top: 50%;
      left: 55%;
      transform: translate(-50%, -50%);
      width: 0;
      height: 0;
      border-left: 15px solid white;
      border-top: 10px solid transparent;
      border-bottom: 10px solid transparent;
    }

    .loading-bar-container {
      width: 300px;
      height: 2px;
      background: rgba(255, 255, 255, 0.2);
      position: relative;
      margin: 0 auto;
    }

    .loading-bar {
      height: 100%;
      background: rgba(255, 255, 255, 0.8);
      transition: width 0.3s ease;
    }

    .loading-dots {
      display: flex;
      gap: 4px;
    }

    .dot {
      width: 4px;
      height: 4px;
      background: rgba(255, 255, 255, 0.6);
      border-radius: 50%;
      opacity: 0.3;
    }

    .dot.animate {
      animation: blink 1s infinite;
    }

    @keyframes blink {
      0%, 100% { opacity: 0.3; }
      50% { opacity: 1; }
    }
  `]
})
export class WelcomeComponent implements OnInit {
  private platformId = inject(PLATFORM_ID);
  loadingProgress = signal(0);
  isHidden = signal(false);

  ngOnInit(): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    this.startLoading();
  }

  private startLoading(): void {
    const duration = 2000; // 2 segundos
    const interval = 50; // Actualizar cada 50ms
    const increment = (100 / duration) * interval;

    const timer = setInterval(() => {
      this.loadingProgress.update(prev => {
        const newProgress = Math.min(prev + increment, 100);
        
        if (newProgress >= 100) {
          clearInterval(timer);
          setTimeout(() => {
            this.isHidden.set(true);
          }, 500);
        }
        
        return newProgress;
      });
    }, interval);
  }
}

