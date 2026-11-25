import {
  AfterViewInit,
  Component,
  ElementRef,
  HostListener,
  NgZone,
  OnDestroy,
  ViewChild,
  inject,
  input,
  effect,
  computed,
  output,
  signal,
} from '@angular/core';
import type { ProjectId } from '../../core/data/projects.data';
import type { JourneyScene, MapLabel } from './journey-scene';
import { createJourneyActivityState, JourneyActivityState } from './journey-activity';
import { LanguageService } from '../../core/services/language.service';
import { ThemeService } from '../../core/services/theme.service';
import type { MapLevel } from './journey-world';

const STOPS: {
  id: ProjectId;
  name: string;
  location: string;
  locationEn: string;
  x: number;
  y: number;
  level: MapLevel;
}[] = [
  {
    id: 'finansmart',
    level: 0,
    name: 'FinanSmart',
    location: 'Mirador financiero',
    locationEn: 'Financial lookout',
    x: 25,
    y: 42,
  },
  {
    id: 'sicop',
    level: 0,
    name: 'SICOP',
    location: 'Archivo de pólizas',
    locationEn: 'Policy archive',
    x: 51,
    y: 34,
  },
  {
    id: 'chatquality',
    level: 0,
    name: 'ChatQuality',
    location: 'Torre de comunicaciones',
    locationEn: 'Communications tower',
    x: 75,
    y: 26,
  },
  {
    id: 'riego',
    name: 'Sistema de Riego',
    location: 'Invernadero',
    locationEn: 'Greenhouse',
    x: 34,
    y: 36,
    level: 1,
  },
  {
    id: 'agropay',
    name: 'AgroPay',
    location: 'Mercado',
    locationEn: 'Market',
    x: 72,
    y: 36,
    level: 1,
  },
  {
    id: 'vinculacion',
    name: 'Vinculación',
    location: 'Riego conectado',
    locationEn: 'Connected irrigation',
    x: 20,
    y: 36,
    level: 1,
  },
  {
    id: 'rgb',
    name: 'Laboratorio RGB',
    location: 'Taller de color',
    locationEn: 'Color workshop',
    x: 28,
    y: 36,
    level: 2,
  },
  {
    id: 'pantufladas',
    name: 'Pantufladas',
    location: 'Proyecto estrella · Cima',
    locationEn: 'Featured project · Summit',
    x: 50,
    y: 34,
    level: 3,
  },
  {
    id: 'novacore',
    name: 'Novacore',
    location: 'Estudio de desarrollo',
    locationEn: 'Development studio',
    x: 72,
    y: 36,
    level: 2,
  },
];

@Component({
  selector: 'app-journey-map',
  standalone: true,
  templateUrl: './journey-map.component.html',
  styleUrls: ['./journey-map.component.css', './journey-controls.css', './journey-progress.css'],
})
export class JourneyMapComponent implements AfterViewInit, OnDestroy {
  readonly i18n = inject(LanguageService);
  @ViewChild('stage', { static: true }) stage!: ElementRef<HTMLElement>;
  @ViewChild('canvasHost', { static: true }) canvasHost!: ElementRef<HTMLElement>;
  readonly visit = output<ProjectId>();
  readonly activity = input<JourneyActivityState>(createJourneyActivityState());
  readonly acceptedCount = computed(
    () => this.activity().transmissions.filter((entry) => entry.accepted).length,
  );
  readonly blockedCount = computed(
    () => this.activity().transmissions.filter((entry) => !entry.accepted).length,
  );
  readonly routeEntry = output<{ x: number; y: number }>();
  readonly stops = signal(STOPS);
  readonly currentLevel = signal<MapLevel>(0);
  readonly visibleStops = computed(() =>
    this.stops().filter((stop) => stop.level === this.currentLevel()),
  );
  readonly levels = [0, 1, 2, 3] as const;
  readonly visitedStops = signal<readonly ProjectId[]>([]);
  readonly visitedCount = computed(
    () => this.visitedStops().filter((id) => id !== 'pantufladas').length,
  );
  readonly completedLevels = computed(() =>
    [0, 1, 2].map((level) =>
      STOPS.filter((stop) => stop.level === level).every((stop) =>
        this.visitedStops().includes(stop.id),
      ),
    ),
  );
  readonly journeyComplete = computed(() => this.visitedCount() === 8);
  readonly ready = signal(false);
  readonly failed = signal(false);
  readonly travelling = signal(false);
  readonly nearest = signal<ProjectId | null>(null);
  readonly currentStop = signal<ProjectId | null>(null);
  private readonly zone = inject(NgZone);
  private readonly appearance = inject(ThemeService);
  private observer?: IntersectionObserver;
  private visibilityObserver?: IntersectionObserver;
  private modalObserver?: MutationObserver;
  private scene?: JourneyScene;
  private pendingStop?: ProjectId;
  private pendingLevel?: MapLevel;
  private lastRouteEntry?: { x: number; y: number };
  private destroyed = false;
  private loading = false;
  private scheduledLoad?: { kind: 'idle' | 'timer'; id: number };

  constructor() {
    effect(() => {
      const state = this.activity();
      this.runScene((scene) => scene.setActivityState(state));
    });
    effect(() => {
      const language = this.i18n.lang();
      this.runScene((scene) => scene.setLanguage(language));
    });
    effect(() => {
      const levels = this.completedLevels();
      const complete = this.journeyComplete();
      this.runScene((scene) => scene.setJourneyProgress(levels, complete));
    });
    effect(() => {
      const glass = this.appearance.theme() === 'liquid-glass';
      this.runScene((scene) => scene.setLiquidGlassLighting(glass));
    });
  }

  ngAfterViewInit(): void {
    this.visibilityObserver = new IntersectionObserver(() => this.syncSceneActivity(), {
      threshold: [0, 0.2],
    });
    this.visibilityObserver.observe(this.canvasHost.nativeElement);
    this.modalObserver = new MutationObserver(() => this.syncSceneActivity());
    this.modalObserver.observe(document.body, {
      subtree: true,
      childList: true,
      attributes: true,
      attributeFilter: ['open'],
    });
    this.observer = new IntersectionObserver(
      (entries) => {
        if (!entries.some((entry) => entry.isIntersecting)) return;
        this.observer?.disconnect();
        this.scheduleScene();
      },
      { rootMargin: '150px' },
    );
    this.observer.observe(this.stage.nativeElement);
  }

  goTo(id: ProjectId): void {
    this.recordVisit(id);
    this.pendingStop = id;
    this.currentStop.set(id);
    this.currentLevel.set(STOPS.find((stop) => stop.id === id)?.level ?? 0);
    this.nearest.set(id);
    this.travelling.set(false);
    this.runScene((scene) => scene.goTo(id));
  }

  focus(): void {
    this.stage.nativeElement.focus({ preventScroll: true });
    if (!this.scene && !this.failed()) void this.loadScene();
  }

  returnToEntrance(): void {
    this.pendingStop = undefined;
    this.pendingLevel = 0;
    this.currentStop.set(null);
    this.nearest.set(null);
    this.focus();
    if (!this.scene || !this.ready()) {
      this.currentLevel.set(0);
      this.travelling.set(false);
      return;
    }
    this.travelling.set(true);
    this.runScene((scene) => {
      const started = scene.returnToEntrance(() =>
        this.zone.run(() => {
          this.currentStop.set(null);
          this.nearest.set(null);
          this.currentLevel.set(0);
          this.travelling.set(false);
        }),
      );
      if (!started) this.zone.run(() => this.travelling.set(false));
    });
  }

  travelToLevel(level: MapLevel): void {
    if (level === 0) {
      this.returnToEntrance();
      return;
    }
    this.pendingStop = undefined;
    this.pendingLevel = level;
    this.focus();
    if (!this.scene || !this.ready()) {
      this.currentLevel.set(level);
      return;
    }
    this.travelling.set(true);
    this.runScene((scene) => {
      const started = scene.travelToLevel(level, () =>
        this.zone.run(() => {
          this.currentLevel.set(level);
          this.travelling.set(false);
        }),
      );
      if (!started) this.zone.run(() => this.travelling.set(false));
    });
  }

  travelTo(id: ProjectId): void {
    this.stage.nativeElement.focus({ preventScroll: true });
    this.pendingStop = id;
    if (!this.scene) {
      this.goTo(id);
      this.visit.emit(id);
      return;
    }
    this.travelling.set(true);
    this.runScene((scene) => {
      const started = scene.travelTo(id, () =>
        this.zone.run(() => {
          this.currentStop.set(id);
          this.travelling.set(false);
          this.recordVisit(id);
          this.visit.emit(id);
        }),
      );
      if (!started)
        this.zone.run(() => {
          this.travelling.set(false);
          this.recordVisit(id);
          this.visit.emit(id);
        });
    });
  }

  openNearest(): void {
    const id = this.nearest();
    if (id) {
      this.recordVisit(id);
      this.visit.emit(id);
    }
  }

  isLevelComplete(level: MapLevel): boolean {
    return level === 3
      ? this.journeyComplete() && this.visitedStops().includes('pantufladas')
      : this.completedLevels()[level];
  }

  private recordVisit(id: ProjectId): void {
    if (!this.visitedStops().includes(id)) this.visitedStops.update((stops) => [...stops, id]);
  }

  get currentName(): string {
    return STOPS.find((stop) => stop.id === this.nearest())?.name ?? '';
  }

  @HostListener('window:keydown', ['$event'])
  onKeyDown(event: KeyboardEvent): void {
    if (event.ctrlKey || event.altKey || event.metaKey || document.querySelector('dialog[open]'))
      return;
    const target = event.target;
    if (
      target instanceof Element &&
      target.closest('input, textarea, select, [contenteditable="true"], [contenteditable=""]')
    )
      return;
    if (!this.keyboardAreaIsVisible()) return;
    const key = event.key.toLowerCase();
    if (!['w', 'a', 's', 'd', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright', 'e'].includes(key))
      return;
    event.preventDefault();
    if (key === 'e') {
      if (!event.repeat) this.openNearest();
      return;
    }
    this.travelling.set(false);
    this.runScene((scene) => scene.setKey(key, true));
  }

  @HostListener('window:keyup', ['$event'])
  onKeyUp(event: KeyboardEvent): void {
    this.runScene((scene) => scene.setKey(event.key, false));
  }

  @HostListener('window:blur')
  clearKeys(): void {
    this.runScene((scene) => scene.clearKeys());
  }

  @HostListener('document:visibilitychange')
  onVisibilityChange(): void {
    this.clearKeys();
    this.syncSceneActivity();
  }

  private runScene(action: (scene: JourneyScene) => void): void {
    const scene = this.scene;
    if (scene) this.zone.runOutsideAngular(() => action(scene));
  }

  private scheduleScene(): void {
    if (this.loading || this.scene || this.scheduledLoad) return;
    const load = () => {
      this.scheduledLoad = undefined;
      void this.loadScene();
    };
    this.zone.runOutsideAngular(() => {
      this.scheduledLoad =
        typeof window.requestIdleCallback === 'function'
          ? { kind: 'idle', id: window.requestIdleCallback(load, { timeout: 700 }) }
          : { kind: 'timer', id: window.setTimeout(load, 0) };
    });
  }

  private cancelScheduledLoad(): void {
    if (!this.scheduledLoad) return;
    if (this.scheduledLoad.kind === 'idle') window.cancelIdleCallback(this.scheduledLoad.id);
    else window.clearTimeout(this.scheduledLoad.id);
    this.scheduledLoad = undefined;
  }

  private syncSceneActivity(): void {
    if (this.destroyed) return;
    const bounds = this.canvasHost.nativeElement.getBoundingClientRect();
    const visibleHeight = Math.min(bounds.bottom, innerHeight) - Math.max(bounds.top, 0);
    const visible =
      visibleHeight >= bounds.height * 0.2 && bounds.right > 0 && bounds.left < innerWidth;
    const active = visible && !document.hidden && !document.querySelector('dialog[open]');
    this.runScene((scene) => scene.setActive(active));
  }

  private keyboardAreaIsVisible(): boolean {
    if (!this.ready() || document.hidden) return false;
    const stage = this.stage.nativeElement;
    const bounds = stage.getBoundingClientRect();
    const visibleHeight = Math.min(bounds.bottom, innerHeight) - Math.max(bounds.top, 0);
    const explicitFocus = stage.contains(document.activeElement);
    return (
      visibleHeight >= Math.min(bounds.height, innerHeight) * 0.55 &&
      (explicitFocus || (bounds.top < innerHeight * 0.6 && bounds.bottom > innerHeight * 0.4))
    );
  }

  ngOnDestroy(): void {
    this.destroyed = true;
    this.cancelScheduledLoad();
    this.observer?.disconnect();
    this.visibilityObserver?.disconnect();
    this.modalObserver?.disconnect();
    this.scene?.dispose();
  }

  private async loadScene(): Promise<void> {
    if (this.loading || this.scene || this.destroyed) return;
    this.cancelScheduledLoad();
    this.loading = true;
    try {
      const { JourneyScene } = await import('./journey-scene');
      if (this.destroyed) return;
      this.zone.runOutsideAngular(() => {
        this.scene = new JourneyScene(
          this.canvasHost.nativeElement,
          (id) =>
            this.zone.run(() => {
              this.nearest.set(id);
              if (id) this.currentStop.set(id);
            }),
          (labels, entry, level) => this.zone.run(() => this.positionLabels(labels, entry, level)),
        );
      });
      this.syncSceneActivity();
      await this.zone.runOutsideAngular(() => this.scene!.prepare());
      if (this.destroyed) return;
      if (this.pendingStop) this.runScene((scene) => scene.goTo(this.pendingStop!));
      else if (this.pendingLevel !== undefined)
        this.runScene((scene) => scene.goToLevel(this.pendingLevel!));
      this.runScene((scene) => scene.setActivityState(this.activity()));
      this.runScene((scene) => scene.setLanguage(this.i18n.lang()));
      this.runScene((scene) =>
        scene.setLiquidGlassLighting(this.appearance.theme() === 'liquid-glass'),
      );
      this.runScene((scene) =>
        scene.setJourneyProgress(this.completedLevels(), this.journeyComplete()),
      );
      this.ready.set(true);
    } catch {
      this.runScene((scene) => scene.dispose());
      this.scene = undefined;
      this.failed.set(true);
    } finally {
      this.loading = false;
    }
  }

  private positionLabels(
    labels: MapLabel[],
    entry: { x: number; y: number },
    level: MapLevel,
  ): void {
    this.currentLevel.set(level);
    this.stops.set(
      STOPS.map((stop) => {
        const label = labels.find((label) => label.id === stop.id);
        return {
          ...stop,
          x: Math.max(13, Math.min(87, label?.x ?? stop.x)),
          y: Math.max(22, Math.min(76, label?.y ?? stop.y)),
        };
      }),
    );
    if (
      !this.lastRouteEntry ||
      Math.abs(this.lastRouteEntry.x - entry.x) > 0.01 ||
      Math.abs(this.lastRouteEntry.y - entry.y) > 0.01
    ) {
      this.lastRouteEntry = { ...entry };
      this.routeEntry.emit(entry);
    }
  }
}
