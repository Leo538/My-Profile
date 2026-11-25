import { TestBed } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { LanguageService } from '../../core/services/language.service';
import { HeroTypewriterComponent } from './hero-typewriter.component';

describe('Texto de presentación animado', () => {
  let reduceMotion = false;
  let hidden = false;
  const originalMatchMedia = Object.getOwnPropertyDescriptor(window, 'matchMedia');
  const originalHidden = Object.getOwnPropertyDescriptor(document, 'hidden');
  const originalTitle = document.title;

  beforeEach(() => {
    vi.useFakeTimers();
    reduceMotion = hidden = false;
    try {
      localStorage.removeItem('portfolio-language');
    } catch {
      /* optional storage */
    }
    Object.defineProperty(document, 'hidden', { configurable: true, get: () => hidden });
    Object.defineProperty(window, 'matchMedia', {
      configurable: true,
      value: () => ({
        matches: reduceMotion,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      }),
    });
    TestBed.configureTestingModule({ imports: [HeroTypewriterComponent] });
  });

  afterEach(() => {
    TestBed.resetTestingModule();
    vi.useRealTimers();
    document.title = originalTitle;
    if (originalMatchMedia) Object.defineProperty(window, 'matchMedia', originalMatchMedia);
    else Reflect.deleteProperty(window, 'matchMedia');
    if (originalHidden) Object.defineProperty(document, 'hidden', originalHidden);
    else Reflect.deleteProperty(document, 'hidden');
  });

  it('deja la primera frase completa y estática con movimiento reducido, también en inglés', () => {
    reduceMotion = true;
    const fixture = TestBed.createComponent(HeroTypewriterComponent);
    fixture.detectChanges();
    expect(fixture.componentInstance.text()).toBe('Desarrollador full stack');
    expect(fixture.nativeElement.getAttribute('data-state')).toBe('static');
    vi.advanceTimersByTime(20000);
    expect(fixture.componentInstance.text()).toBe('Desarrollador full stack');
    TestBed.inject(LanguageService).setLanguage('en');
    fixture.detectChanges();
    expect(fixture.componentInstance.text()).toBe('Full-stack developer');
    expect(fixture.nativeElement.querySelector('.typewriter-sr').textContent).toContain(
      'Software Engineering student',
    );
  });

  it('termina cada frase y la mantiene legible antes de pasar a la más larga', () => {
    const fixture = TestBed.createComponent(HeroTypewriterComponent);
    fixture.detectChanges();
    const component = fixture.componentInstance;
    const first = component.phrases()[0];
    const second = component.phrases()[1];
    vi.advanceTimersByTime(first.length * 60);
    expect(component.text()).toBe(first);
    expect(component.state()).toBe('holding');
    vi.advanceTimersByTime(2399);
    expect(component.text()).toBe(first);
    expect(component.state()).toBe('holding');
    vi.advanceTimersByTime(1 + first.length * 30 + 180 + second.length * 60);
    expect(component.text()).toBe(second);
    expect(component.state()).toBe('holding');
    fixture.detectChanges();
    const accessibleCopy = fixture.nativeElement.querySelector('.typewriter-sr');
    expect(accessibleCopy.textContent).toContain(first);
    expect(accessibleCopy.hasAttribute('aria-live')).toBe(false);
  });

  it('pausa el trabajo con la pestaña oculta y cancela el avance al destruirse', () => {
    const fixture = TestBed.createComponent(HeroTypewriterComponent);
    fixture.detectChanges();
    const component = fixture.componentInstance;
    vi.advanceTimersByTime(120);
    const partial = component.text();
    expect(partial.length).toBe(2);
    hidden = true;
    document.dispatchEvent(new Event('visibilitychange'));
    vi.advanceTimersByTime(10000);
    expect(component.text()).toBe(partial);
    hidden = false;
    document.dispatchEvent(new Event('visibilitychange'));
    vi.advanceTimersByTime(60);
    expect(component.text().length).toBe(3);
    fixture.destroy();
    const stopped = component.text();
    vi.advanceTimersByTime(10000);
    expect(component.text()).toBe(stopped);
  });
});
