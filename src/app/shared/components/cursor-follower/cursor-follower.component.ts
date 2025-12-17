import { Component, OnInit, OnDestroy, HostListener, PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

@Component({
  selector: 'app-cursor-follower',
  standalone: true,
  template: `
    <div 
      class="cursor-follower"
      [class.cursor-follower--hover]="isHovering"
      [style.left.px]="x"
      [style.top.px]="y"
      aria-hidden="true"
    ></div>
  `,
  styles: [`
    .cursor-follower {
      position: fixed;
      width: 20px;
      height: 20px;
      border: 2px solid black;
      border-radius: 50%;
      pointer-events: none;
      z-index: 9999;
      transform: translate(-50%, -50%);
      transition: width 0.3s ease, height 0.3s ease, opacity 0.3s ease;
      mix-blend-mode: difference;
    }

    .cursor-follower--hover {
      width: 40px;
      height: 40px;
      opacity: 0.7;
    }

    @media (pointer: coarse), (max-width: 767px) {
      .cursor-follower {
        display: none;
      }
    }
  `]
})
export class CursorFollowerComponent implements OnInit, OnDestroy {
  private platformId = inject(PLATFORM_ID);
  private animationFrameId: number | null = null;
  
  x = 0;
  y = 0;
  isHovering = false;
  
  private targetX = 0;
  private targetY = 0;
  private currentX = 0;
  private currentY = 0;
  private readonly lerpFactor = 0.15;

  ngOnInit(): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    this.setupEventListeners();
    this.setupInteractiveElements();
    this.animate();
  }

  ngOnDestroy(): void {
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
    }
    if (isPlatformBrowser(this.platformId)) {
      document.removeEventListener('mousemove', this.onMouseMove);
      document.removeEventListener('mouseenter', this.onMouseEnter, true);
      document.removeEventListener('mouseleave', this.onMouseLeave, true);
    }
  }

  private onMouseMove = (event: MouseEvent): void => {
    this.targetX = event.clientX;
    this.targetY = event.clientY;
  };

  private onMouseEnter = (event: MouseEvent): void => {
    const target = event.target as HTMLElement;
    if (this.isInteractiveElement(target)) {
      this.isHovering = true;
    }
  };

  private onMouseLeave = (event: MouseEvent): void => {
    const target = event.target as HTMLElement;
    if (this.isInteractiveElement(target)) {
      this.isHovering = false;
    }
  };

  private setupEventListeners(): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }
    document.addEventListener('mousemove', this.onMouseMove);
    document.addEventListener('mouseenter', this.onMouseEnter, true);
    document.addEventListener('mouseleave', this.onMouseLeave, true);
  }

  private setupInteractiveElements(): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    const interactiveSelectors = 'a, button, [role="button"], input, textarea, select, [tabindex]:not([tabindex="-1"])';
    const elements = document.querySelectorAll(interactiveSelectors);

    elements.forEach(element => {
      element.addEventListener('mouseenter', () => {
        this.isHovering = true;
      });
      element.addEventListener('mouseleave', () => {
        this.isHovering = false;
      });
    });
  }

  private isInteractiveElement(element: HTMLElement): boolean {
    const tagName = element.tagName.toLowerCase();
    const role = element.getAttribute('role');
    const tabIndex = element.getAttribute('tabindex');
    
    return (
      tagName === 'a' ||
      tagName === 'button' ||
      tagName === 'input' ||
      tagName === 'textarea' ||
      tagName === 'select' ||
      role === 'button' ||
      (tabIndex !== null && tabIndex !== '-1')
    );
  }

  private animate(): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    this.currentX += (this.targetX - this.currentX) * this.lerpFactor;
    this.currentY += (this.targetY - this.currentY) * this.lerpFactor;

    this.x = this.currentX;
    this.y = this.currentY;

    this.animationFrameId = requestAnimationFrame(() => this.animate());
  }
}

