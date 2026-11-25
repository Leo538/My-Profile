import {
  AfterViewInit,
  Component,
  ElementRef,
  OnChanges,
  OnDestroy,
  SimpleChanges,
  ViewChild,
  computed,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import { PortfolioProject } from '../../core/data/projects.data';
import { LanguageService } from '../../core/services/language.service';
import { Submission } from '../explore/challenge';
import {
  JourneyActivityState,
  appendSimulatedTransmission,
  createJourneyActivityState,
} from '../journey-map/journey-activity';
import { AmortizationSystem, calculateLoan } from './loan';
import { ProjectGalleryComponent } from './project-gallery.component';
import { AdditionalProjectActivityComponent } from './additional-project-activity.component';
import { NewProjectActivityComponent } from './new-project-activity.component';

@Component({
  selector: 'app-project-sheet',
  standalone: true,
  imports: [
    ProjectGalleryComponent,
    AdditionalProjectActivityComponent,
    NewProjectActivityComponent,
  ],
  templateUrl: './project-sheet.component.html',
  host: { class: 'project-sheet' },
})
export class ProjectSheetComponent implements AfterViewInit, OnChanges, OnDestroy {
  readonly i18n = inject(LanguageService);
  readonly project = input.required<PortfolioProject>();
  readonly galleryImages = computed(() => this.project().images ?? []);
  readonly activity = input<JourneyActivityState>(createJourneyActivityState());
  readonly activityChange = output<JourneyActivityState>();
  readonly dismiss = output<void>();
  readonly activeTab = signal<'project' | 'information' | 'activity' | 'schedule'>('project');
  readonly infoPage = signal<0 | 1 | 2>(0);
  readonly projectSummary = computed(() => {
    const first = this.project().description.split(/(?<=[.!?])\s+/)[0];
    if (first.length <= 120) return first;
    const preview = first.slice(0, 120);
    return preview.slice(0, preview.lastIndexOf(' ')) + '…';
  });
  readonly loanPage = signal(0);
  readonly schedulePageSize = 4;
  readonly Math = Math;
  @ViewChild('dialog', { static: true }) private dialog!: ElementRef<HTMLDialogElement>;
  readonly amortization = signal<AmortizationSystem>('french');
  readonly loanMonths = signal(12);
  readonly loanTerms = [6, 12, 24, 36];
  readonly frenchLoan = computed(() => calculateLoan(10000, 12, this.loanMonths(), 'french'));
  readonly germanLoan = computed(() => calculateLoan(10000, 12, this.loanMonths(), 'german'));
  readonly loan = computed(() =>
    this.amortization() === 'french' ? this.frenchLoan() : this.germanLoan(),
  );
  readonly schedulePages = computed(() =>
    Math.ceil(this.loan().rows.length / this.schedulePageSize),
  );
  readonly visibleLoanRows = computed(() =>
    this.loan().rows.slice(
      this.loanPage() * this.schedulePageSize,
      (this.loanPage() + 1) * this.schedulePageSize,
    ),
  );
  readonly policyStage = signal(0);
  readonly policySteps = computed(() =>
    this.i18n.lang() === 'es'
      ? ['Registro', 'Revisión jurídica', 'Validación financiera', 'Validada']
      : ['Registration', 'Legal review', 'Financial validation', 'Validated'],
  );
  readonly policyStatus = computed(
    () =>
      (this.i18n.lang() === 'es'
        ? ['Registrada', 'En revisión jurídica', 'En validación financiera', 'Validada']
        : ['Registered', 'Under legal review', 'Under financial validation', 'Validated'])[
        this.policyStage()
      ],
  );
  readonly policyActions = computed(() =>
    this.i18n.lang() === 'es'
      ? ['Pasar a revisión jurídica', 'Validar revisión jurídica', 'Validar revisión financiera']
      : ['Start legal review', 'Approve legal review', 'Approve financial review'],
  );
  readonly transmissions = signal<Submission[]>([]);
  readonly playing = signal(false);
  private playbackTimers: number[] = [];
  private closing = false;
  private previousBodyOverflow = '';
  private previousRootOverflow = '';
  private readonly currencyFormatter = computed(
    () => new Intl.NumberFormat(this.i18n.locale(), { style: 'currency', currency: 'USD' }),
  );
  private readonly numberFormatter = computed(
    () =>
      new Intl.NumberFormat(this.i18n.locale(), {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }),
  );

  ngAfterViewInit(): void {
    this.previousBodyOverflow = document.body.style.overflow;
    this.previousRootOverflow = document.documentElement.style.overflow;
    document.body.style.overflow = 'hidden';
    document.documentElement.style.overflow = 'hidden';
    this.dialog.nativeElement.showModal();
  }

  ngOnChanges(changes: SimpleChanges): void {
    const projectChange = changes['project'];
    if (projectChange && projectChange.previousValue?.id !== projectChange.currentValue.id) {
      this.cancelPlayback();
      this.resetLoan();
      this.activeTab.set('project');
      this.infoPage.set(0);
    }
    const state = this.activity();
    this.policyStage.set(Math.max(0, Math.min(3, state.policyStage)));
    this.transmissions.set([...state.transmissions]);
  }

  money(amount: number): string {
    return this.currencyFormatter().format(amount);
  }

  number(amount: number): string {
    return this.numberFormatter().format(amount);
  }

  selectTab(tab: 'project' | 'information' | 'activity' | 'schedule'): void {
    if (tab === 'schedule' && this.project().id !== 'finansmart') return;
    this.activeTab.set(tab);
    this.dialog.nativeElement.scrollTop = 0;
  }

  onTabKeyDown(event: KeyboardEvent): void {
    if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
    event.preventDefault();
    const tabs: ('project' | 'information' | 'activity' | 'schedule')[] =
      this.project().id === 'finansmart'
        ? ['project', 'information', 'activity', 'schedule']
        : ['project', 'information', 'activity'];
    const current = tabs.indexOf(this.activeTab());
    const next =
      event.key === 'Home'
        ? 0
        : event.key === 'End'
          ? tabs.length - 1
          : (current + (event.key === 'ArrowRight' ? 1 : -1) + tabs.length) % tabs.length;
    this.selectTab(tabs[next]);
    document.getElementById(`sheet-${tabs[next]}-tab`)?.focus();
  }

  changeAmortization(system: AmortizationSystem): void {
    this.amortization.set(system);
    this.loanPage.set(0);
  }

  changeSchedulePage(delta: number): void {
    this.loanPage.update((page) => Math.max(0, Math.min(this.schedulePages() - 1, page + delta)));
  }

  nextPolicyStage(): void {
    this.policyStage.update((stage) => Math.min(stage + 1, this.policySteps().length - 1));
    this.publishActivity();
  }

  resetPolicy(): void {
    this.policyStage.set(0);
    this.publishActivity();
  }

  changeLoanTerm(event: Event): void {
    const months = Number((event.target as HTMLSelectElement).value);
    if (this.loanTerms.includes(months)) {
      this.loanMonths.set(months);
      this.loanPage.set(0);
    }
  }

  resetLoan(): void {
    this.loanMonths.set(12);
    this.amortization.set('french');
    this.loanPage.set(0);
  }

  sendSimulatedMessage(): void {
    if (this.playing() || this.transmissions().length >= 6) return;
    this.appendTransmission();
  }

  private appendTransmission(): void {
    this.transmissions.update(appendSimulatedTransmission);
    this.publishActivity();
  }

  private publishActivity(): void {
    this.activityChange.emit({
      policyStage: this.policyStage(),
      transmissions: [...this.transmissions()],
    });
  }

  playTransmissions(): void {
    if (this.playing()) return;
    this.resetTransmissions();
    this.playing.set(true);
    const times = [0, 2, 4, 6, 8, 9];
    this.playbackTimers = times.map((seconds, index) =>
      window.setTimeout(() => {
        this.appendTransmission();
        if (index === times.length - 1) this.playing.set(false);
      }, seconds * 250),
    );
  }

  resetTransmissions(): void {
    this.cancelPlayback();
    this.transmissions.set([]);
    this.publishActivity();
  }

  private cancelPlayback(): void {
    this.playbackTimers.forEach((timer) => window.clearTimeout(timer));
    this.playbackTimers = [];
    this.playing.set(false);
  }

  requestClose(): void {
    if (this.closing) return;
    this.closing = true;
    this.cancelPlayback();
    this.dialog.nativeElement.close();
    this.dismiss.emit();
  }

  cancel(event: Event): void {
    event.preventDefault();
    this.requestClose();
  }

  nativeClose(): void {
    if (!this.closing) this.dismiss.emit();
  }

  backdropClick(event: MouseEvent): void {
    const dialog = this.dialog.nativeElement;
    if (event.target !== dialog) return;
    const bounds = dialog.getBoundingClientRect();
    if (
      event.clientX < bounds.left ||
      event.clientX > bounds.right ||
      event.clientY < bounds.top ||
      event.clientY > bounds.bottom
    )
      this.requestClose();
  }

  ngOnDestroy(): void {
    this.closing = true;
    this.cancelPlayback();
    this.dialog.nativeElement.close();
    document.body.style.overflow = this.previousBodyOverflow;
    document.documentElement.style.overflow = this.previousRootOverflow;
  }
}
