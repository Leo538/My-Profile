import { DatePipe } from '@angular/common';
import {
  AfterViewInit,
  Component,
  ElementRef,
  OnDestroy,
  ViewChild,
  inject,
  computed,
  signal,
} from '@angular/core';
import { FormsModule, NgForm } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CREDENTIALS } from '../../core/data/credentials.data';
import { PORTFOLIO_PROJECTS, ProjectId, PortfolioProject } from '../../core/data/projects.data';
import { EmailService } from '../../core/services/email.service';
import { LanguageService } from '../../core/services/language.service';
import { ThemeService } from '../../core/services/theme.service';
import { PROJECTS_EN } from '../../core/data/projects.en';
import { JourneyMapComponent } from '../journey-map/journey-map.component';
import { ProjectSheetComponent } from '../project-sheet/project-sheet.component';
import { HeroTypewriterComponent } from './hero-typewriter.component';
import { createJourneyActivityState } from '../journey-map/journey-activity';

@Component({
  selector: 'app-portfolio',
  imports: [
    RouterLink,
    FormsModule,
    DatePipe,
    JourneyMapComponent,
    ProjectSheetComponent,
    HeroTypewriterComponent,
  ],
  templateUrl: './portfolio.component.html',
  host: { class: 'portfolio-page' },
})
export class PortfolioComponent implements AfterViewInit, OnDestroy {
  @ViewChild('opening', { static: true }) private opening!: ElementRef<HTMLElement>;
  @ViewChild('signatureTail', { static: true }) private signatureTail!: ElementRef<SVGPathElement>;
  @ViewChild('projectMenu', { static: true }) private projectMenu?: ElementRef<HTMLDetailsElement>;
  @ViewChild('credentialRail', { static: true }) private credentialRail!: ElementRef<HTMLElement>;
  readonly i18n = inject(LanguageService);
  readonly appearance = inject(ThemeService);
  readonly appearanceHintDismissed = signal(false);
  readonly credentialRailPaging = signal({ previous: false, next: false });
  readonly credentials = computed(() =>
    CREDENTIALS.map((credential) => ({
      ...credential,
      imageAlt: this.i18n.text(
        credential.imageAlt,
        'Official credential artwork: ' + credential.name,
      ),
    })),
  );
  readonly projects = computed(() =>
    PORTFOLIO_PROJECTS.map((project) =>
      this.i18n.lang() === 'es' ? project : { ...project, ...PROJECTS_EN[project.id] },
    ),
  );
  readonly additionalProjects = computed(() =>
    this.projects().filter(
      (project) => !['finansmart', 'sicop', 'chatquality'].includes(project.id),
    ),
  );
  readonly menuOpen = signal(false);
  private readonly activeProjectId = signal<ProjectId | null>(null);
  readonly activeProject = computed<PortfolioProject | null>(
    () => this.projects().find((project) => project.id === this.activeProjectId()) ?? null,
  );
  readonly journeyActivity = signal(createJourneyActivityState());
  readonly cvUrl = 'assets/documents/Leonel-Barros-CV.pdf?v=b26d354d5123';
  readonly submitting = signal(false);
  readonly contactStatus = signal('');
  readonly contactSuccess = signal(false);
  readonly routePath = signal('');
  readonly routeViewBox = signal('0 0 1440 1200');
  private readonly email = inject(EmailService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private journey?: JourneyMapComponent;
  private stop?: ProjectId;
  private entry?: { x: number; y: number };
  private openingObserver?: ResizeObserver;
  private railObserver?: ResizeObserver;
  formData = { name: '', email: '', message: '' };

  @ViewChild(JourneyMapComponent)
  set map(map: JourneyMapComponent) {
    this.journey = map;
    if (this.stop) map.goTo(this.stop);
  }

  constructor() {
    this.route.queryParamMap.pipe(takeUntilDestroyed()).subscribe((params) => {
      const project = PORTFOLIO_PROJECTS.find((item) => item.id === params.get('proyecto')) ?? null;
      this.activeProjectId.set(project?.id ?? null);
      if (project) {
        this.stop = project.id;
        this.journey?.goTo(project.id);
        this.closeMenu();
        requestAnimationFrame(() => {
          if (this.activeProject()?.id === project.id) {
            document
              .getElementById('mapa')
              ?.scrollIntoView({ behavior: 'instant', block: 'start' });
          }
        });
      }
    });
  }

  ngAfterViewInit(): void {
    this.openingObserver = new ResizeObserver(() => this.drawConnection());
    this.openingObserver.observe(this.opening.nativeElement);
    this.railObserver = new ResizeObserver(() => {
      this.measureCredentialRail(this.credentialRail.nativeElement);
    });
    this.railObserver.observe(this.credentialRail.nativeElement);
  }

  measureCredentialRail(element: HTMLElement): void {
    const previous = element.scrollLeft > 3;
    const next = element.scrollLeft + element.clientWidth < element.scrollWidth - 3;
    this.credentialRailPaging.update((state) =>
      state.previous === previous && state.next === next ? state : { previous, next },
    );
  }

  moveRail(element: HTMLElement, direction: -1 | 1): void {
    const firstCard = element.firstElementChild;
    if (!firstCard) return;
    const gap = Number.parseFloat(getComputedStyle(element).columnGap) || 0;
    element.scrollBy({
      left: direction * (firstCard.getBoundingClientRect().width + gap),
      behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth',
    });
  }

  connectRoute(entry: { x: number; y: number }): void {
    this.entry = entry;
    this.drawConnection();
  }

  private drawConnection(): void {
    if (!this.entry || !this.journey) return;
    const path = this.signatureTail.nativeElement;
    const matrix = path.getScreenCTM();
    if (!matrix) return;
    const bounds = this.opening.nativeElement.getBoundingClientRect();
    const compact = bounds.width < 760;
    const anchor = compact ? path.getPointAtLength(path.getTotalLength()) : new DOMPoint(126, 216);
    const tip = new DOMPoint(anchor.x, anchor.y).matrixTransform(matrix);
    const map = this.journey.canvasHost.nativeElement.getBoundingClientRect();
    const startX = tip.x - bounds.left;
    const startY = tip.y - bounds.top;
    const endX = map.left - bounds.left + (map.width * this.entry.x) / 100;
    const endY = map.top - bounds.top + (map.height * this.entry.y) / 100;
    this.routeViewBox.set(`0 0 ${bounds.width} ${bounds.height}`);
    const firstControlX = compact ? bounds.width - 12 : startX - 200;
    const secondControlX = compact ? bounds.width - 12 : endX - 300;
    this.routePath.set(
      `M ${startX} ${startY} C ${firstControlX} ${startY + 140}, ${secondControlX} ${endY - 160}, ${endX} ${endY}`,
    );
  }

  ngOnDestroy(): void {
    this.openingObserver?.disconnect();
    this.railObserver?.disconnect();
  }

  openProject(id: ProjectId): void {
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { proyecto: id },
      queryParamsHandling: 'merge',
      fragment: 'mapa',
    });
  }

  closeProject(): void {
    void this.router
      .navigate([], {
        relativeTo: this.route,
        queryParams: { proyecto: null },
        queryParamsHandling: 'merge',
        fragment: 'mapa',
        replaceUrl: true,
      })
      .then(() => requestAnimationFrame(() => this.journey?.focus()));
    document.getElementById('mapa')?.scrollIntoView({ behavior: 'instant', block: 'start' });
  }

  closeMenu(): void {
    this.menuOpen.set(false);
    if (this.projectMenu) this.projectMenu.nativeElement.open = false;
  }

  startJourney(event: Event): void {
    event.preventDefault();
    this.menuOpen.set(false);
    document.getElementById('mapa')?.scrollIntoView({
      behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth',
      block: 'start',
    });
    this.journey?.focus();
  }

  async sendMessage(form: NgForm): Promise<void> {
    if (this.submitting()) return;
    if (form.invalid || !this.formData.name.trim() || !this.formData.message.trim()) {
      form.control.markAllAsTouched();
      this.contactSuccess.set(false);
      this.contactStatus.set('invalid');
      return;
    }
    this.submitting.set(true);
    this.contactStatus.set('');
    try {
      const result = await this.email.sendEmail(this.formData);
      this.contactSuccess.set(result.success);
      this.contactStatus.set(result.success ? 'success' : 'error');
      if (result.success) form.resetForm({ name: '', email: '', message: '' });
    } catch {
      this.contactSuccess.set(false);
      this.contactStatus.set('error');
    } finally {
      this.submitting.set(false);
    }
  }

  readonly contactFeedback = computed(() => {
    switch (this.contactStatus()) {
      case 'invalid':
        return this.i18n.text(
          'Completa tu nombre, un correo válido y el mensaje.',
          'Enter your name, a valid email address and your message.',
        );
      case 'success':
        return this.i18n.text(
          'Tu mensaje se envió correctamente. Gracias por escribir.',
          'Your message was sent successfully. Thanks for getting in touch.',
        );
      case 'error':
        return this.i18n.text(
          'No se pudo enviar el mensaje. Puedes contactarme por LinkedIn o por correo.',
          'Your message could not be sent. You can contact me on LinkedIn or by email.',
        );
      default:
        return '';
    }
  });

  get contactEmail(): string {
    return this.email.recipient;
  }

  get contactDraftUrl(): string {
    const subject = this.i18n.text('Contacto desde el portafolio', 'Portfolio inquiry');
    const { name, email, message } = this.formData;
    const body = `${message.trim()}\r\n\r\n${name.trim()} <${email.trim()}>`;
    return `mailto:${this.contactEmail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  }
}
