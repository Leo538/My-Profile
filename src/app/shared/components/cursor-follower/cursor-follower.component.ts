import { Component, AfterViewInit, OnDestroy, PLATFORM_ID, inject, ViewChild, ElementRef } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

@Component({
  selector: 'app-cursor-follower',
  standalone: true,
  template: `
    <div 
      #cursorElement
      class="cursor-follower"
      [class.cursor-follower--hover]="isHovering"
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
export class CursorFollowerComponent implements AfterViewInit, OnDestroy {
  @ViewChild('cursorElement', { static: false }) cursorElement!: ElementRef<HTMLElement>;
  
  private platformId = inject(PLATFORM_ID);
  private animationFrameId: number | null = null;
  
  isHovering = false;
  
  private targetX = 0;
  private targetY = 0;
  private currentX = 0;
  private currentY = 0;
  private readonly lerpFactor = 0.15;

  ngAfterViewInit(): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    this.setupEventListeners();
    this.setupInteractiveElements();
    
    // Start animation after view initialization to avoid ExpressionChangedAfterItHasBeenCheckedError
    // Use setTimeout to ensure it runs after the current change detection cycle
    setTimeout(() => {
      this.animate();
    }, 0);
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
    if (target && this.isInteractiveElement(target)) {
      this.isHovering = true;
    }
  };

  private onMouseLeave = (event: MouseEvent): void => {
    const target = event.target as HTMLElement;
    if (target && this.isInteractiveElement(target)) {
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

  private isInteractiveElement(element: HTMLElement | null): boolean {
    if (!element || !element.tagName) {
      return false;
    }
    
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

    // Update DOM directly to avoid ExpressionChangedAfterItHasBeenCheckedError
    // This bypasses Angular's change detection for position updates
    const element = this.cursorElement?.nativeElement;
    if (element) {
      element.style.left = `${this.currentX}px`;
      element.style.top = `${this.currentY}px`;
    }

    this.animationFrameId = requestAnimationFrame(() => this.animate());
  }
}

