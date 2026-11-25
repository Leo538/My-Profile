import { DOCUMENT } from '@angular/common';
import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  OnDestroy,
  computed,
  effect,
  inject,
  signal,
  untracked,
} from '@angular/core';
import { LanguageService } from '../../core/services/language.service';

type TypingState = 'typing' | 'holding' | 'deleting' | 'static';

const PHRASES = {
  es: [
    'Desarrollador full stack',
    'Estudiante de Ingeniería de Software',
    'C#/.NET · Angular · SQL',
  ],
  en: ['Full-stack developer', 'Software Engineering student', 'C#/.NET · Angular · SQL'],
} as const;

/** A small, isolated animation; it never drives the rest of the portfolio's change detection. */
@Component({
  selector: 'app-hero-typewriter',
  standalone: true,
  templateUrl: './hero-typewriter.component.html',
  styleUrl: './hero-typewriter.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    'data-testid': 'hero-typewriter',
    '[attr.data-phrase]': 'phraseIndex()',
    '[attr.data-state]': 'state()',
    '[attr.data-reduced-motion]': 'reducedMotion()',
    '[class.is-paused]': 'paused()',
  },
})
export class HeroTypewriterComponent implements AfterViewInit, OnDestroy {
  private readonly document = inject(DOCUMENT);
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly view = this.document.defaultView;
  private readonly media = this.view?.matchMedia?.('(prefers-reduced-motion: reduce)');
  private readonly language = inject(LanguageService);

  readonly phrases = computed(() => PHRASES[this.language.lang()]);
  readonly accessibleText = computed(() => this.phrases().join('. '));
  readonly reducedMotion = signal(this.media?.matches ?? false);
  readonly phraseIndex = signal(0);
  readonly state = signal<TypingState>(this.reducedMotion() ? 'static' : 'typing');
  readonly text = signal<string>(this.reducedMotion() ? this.phrases()[0] : '');
  readonly paused = signal(this.document.hidden);

  private timer?: number;
  private nextDelay = 60;
  private dueAt = 0;
  private inViewport = true;
  private destroyed = false;
  private observer?: IntersectionObserver;

  constructor() {
    this.media?.addEventListener('change', this.onMotionChange);
    this.document.addEventListener('visibilitychange', this.onVisibilityChange);
    effect(() => {
      // A language or motion preference change starts a complete, coherent phrase.
      this.phrases();
      const reduced = this.reducedMotion();
      untracked(() => this.restart(reduced));
    });
  }

  ngAfterViewInit(): void {
    if (typeof IntersectionObserver === 'undefined') return;
    this.observer = new IntersectionObserver(([entry]) => {
      this.inViewport = entry.isIntersecting;
      this.syncVisibility();
    });
    this.observer.observe(this.host.nativeElement);
  }

  private readonly onMotionChange = (event: MediaQueryListEvent): void => {
    this.reducedMotion.set(event.matches);
  };

  private readonly onVisibilityChange = (): void => this.syncVisibility();

  private restart(reduced: boolean): void {
    this.cancelTimer();
    this.phraseIndex.set(0);
    this.state.set(reduced ? 'static' : 'typing');
    this.text.set(reduced ? this.phrases()[0] : '');
    this.schedule(60);
  }

  private schedule(delay: number): void {
    this.nextDelay = delay;
    if (this.destroyed || this.reducedMotion() || this.paused() || !this.view) return;
    this.dueAt = this.view.performance.now() + delay;
    this.timer = this.view.setTimeout(() => {
      this.timer = undefined;
      this.step();
    }, delay);
  }

  private step(): void {
    if (this.destroyed || this.reducedMotion() || this.paused()) return;
    const phrase = this.phrases()[this.phraseIndex()];
    if (this.state() === 'holding') {
      this.state.set('deleting');
      this.schedule(30);
      return;
    }
    if (this.state() === 'deleting') {
      const remaining = this.text().slice(0, -1);
      this.text.set(remaining);
      if (!remaining) {
        this.phraseIndex.update((index) => (index + 1) % this.phrases().length);
        this.state.set('typing');
        this.schedule(180);
      } else this.schedule(30);
      return;
    }
    const next = phrase.slice(0, this.text().length + 1);
    this.text.set(next);
    if (next === phrase) {
      this.state.set('holding');
      this.schedule(2400);
    } else this.schedule(60);
  }

  private syncVisibility(): void {
    const shouldPause = this.document.hidden || !this.inViewport;
    if (this.paused() === shouldPause) return;
    if (shouldPause && this.timer !== undefined && this.view) {
      this.nextDelay = Math.max(0, this.dueAt - this.view.performance.now());
      this.cancelTimer();
    }
    this.paused.set(shouldPause);
    if (!shouldPause) this.schedule(this.nextDelay);
  }

  private cancelTimer(): void {
    if (this.timer !== undefined) this.view?.clearTimeout(this.timer);
    this.timer = undefined;
  }

  ngOnDestroy(): void {
    this.destroyed = true;
    this.cancelTimer();
    this.observer?.disconnect();
    this.media?.removeEventListener('change', this.onMotionChange);
    this.document.removeEventListener('visibilitychange', this.onVisibilityChange);
  }
}
