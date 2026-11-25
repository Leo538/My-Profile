import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  OnChanges,
  ViewChild,
  computed,
  inject,
  input,
  signal,
} from '@angular/core';
import type { AdditionalProjectId } from '../../core/data/projects.data';
import { LanguageService } from '../../core/services/language.service';
import {
  adjustChannel,
  calculateIrrigation,
  calculateOrderTotal,
  clamp,
  nextOrderStage,
} from './additional-activity';

type StudioService = 'web' | 'mobile' | 'cloud' | 'ai';

@Component({
  selector: 'app-additional-project-activity',
  standalone: true,
  templateUrl: './additional-project-activity.component.html',
  styleUrl: './additional-project-activity.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdditionalProjectActivityComponent implements OnChanges {
  readonly projectId = input.required<AdditionalProjectId>();
  readonly i18n = inject(LanguageService);
  readonly soilHumidity = signal(36);
  readonly temperature = signal(25);
  readonly irrigation = computed(() =>
    calculateIrrigation(this.soilHumidity(), this.temperature()),
  );
  readonly quantity = signal(2);
  readonly orderStage = signal(0);
  readonly orderTotal = computed(() => calculateOrderTotal(this.quantity()));
  readonly red = signal(100);
  readonly green = signal(100);
  readonly blue = signal(100);
  readonly service = signal<StudioService>('web');
  readonly studioStage = signal(0);
  private canvas?: HTMLCanvasElement;
  private sampleImage?: HTMLImageElement;
  private originalPixels?: Uint8ClampedArray;
  @ViewChild('rgbCanvas') set rgbCanvas(reference: ElementRef<HTMLCanvasElement> | undefined) {
    this.canvas = reference?.nativeElement;
    this.originalPixels = undefined;
    this.renderRgb();
  }
  readonly services: readonly StudioService[] = ['web', 'mobile', 'cloud', 'ai'];
  readonly orderStages = computed(() =>
    this.i18n.lang() === 'es'
      ? ['Carrito', 'Pedido recibido', 'Pago revisado', 'Listo para entregar']
      : ['Cart', 'Order received', 'Payment reviewed', 'Ready for delivery'],
  );
  readonly orderAction = computed(() =>
    this.i18n.lang() === 'es'
      ? ['Confirmar pedido', 'Revisar pago', 'Preparar entrega', 'Pedido completado'][
          this.orderStage()
        ]
      : ['Confirm order', 'Review payment', 'Prepare delivery', 'Order completed'][
          this.orderStage()
        ],
  );
  readonly studioStages = computed(() =>
    this.i18n.lang() === 'es'
      ? ['Descubrimiento', 'Diseño', 'Desarrollo', 'Entrega']
      : ['Discovery', 'Design', 'Development', 'Delivery'],
  );
  private readonly currency = computed(
    () =>
      new Intl.NumberFormat(this.i18n.locale(), {
        style: 'currency',
        currency: 'USD',
      }),
  );

  ngOnChanges(): void {
    this.reset();
  }

  value(event: Event): number {
    return Number((event.target as HTMLInputElement).value);
  }
  setSoil(event: Event): void {
    this.soilHumidity.set(clamp(this.value(event), 0, 64));
  }
  setTemperature(event: Event): void {
    this.temperature.set(clamp(this.value(event), 0, 50));
  }
  setQuantity(delta: number): void {
    if (this.orderStage() === 0) this.quantity.update((quantity) => clamp(quantity + delta, 1, 12));
  }
  advanceOrder(): void {
    this.orderStage.update(nextOrderStage);
  }
  setChannel(channel: 'red' | 'green' | 'blue', event: Event): void {
    this[channel].set(clamp(this.value(event), 0, 200));
    this.renderRgb();
  }
  loadRgbSample(event: Event): void {
    this.sampleImage = event.target as HTMLImageElement;
    this.originalPixels = undefined;
    this.renderRgb();
  }
  private renderRgb(): void {
    if (!this.canvas || !this.sampleImage?.complete || !this.sampleImage.naturalWidth) return;
    const context = this.canvas.getContext('2d', { willReadFrequently: true });
    if (!context) return;
    if (!this.originalPixels) {
      context.drawImage(this.sampleImage, 0, 0, this.canvas.width, this.canvas.height);
      this.originalPixels = context.getImageData(0, 0, this.canvas.width, this.canvas.height).data;
    }
    const image = context.createImageData(this.canvas.width, this.canvas.height);
    image.data.set(this.originalPixels);
    for (let index = 0; index < image.data.length; index += 4) {
      image.data[index] = adjustChannel(image.data[index], this.red());
      image.data[index + 1] = adjustChannel(image.data[index + 1], this.green());
      image.data[index + 2] = adjustChannel(image.data[index + 2], this.blue());
    }
    context.putImageData(image, 0, 0);
  }
  selectService(service: StudioService): void {
    this.service.set(service);
    this.studioStage.set(0);
  }
  advanceStudio(): void {
    this.studioStage.update((stage) => Math.min(3, stage + 1));
  }
  money(value: number): string {
    return this.currency().format(value);
  }
  duration(): string {
    return new Intl.NumberFormat(this.i18n.locale(), { maximumFractionDigits: 1 }).format(
      this.irrigation().minutes,
    );
  }
  serviceName(service: StudioService): string {
    const es = {
      web: 'Desarrollo web',
      mobile: 'Apps móviles',
      cloud: 'Cloud y DevOps',
      ai: 'IA y datos',
    };
    const en = {
      web: 'Web development',
      mobile: 'Mobile apps',
      cloud: 'Cloud & DevOps',
      ai: 'AI & data',
    };
    return this.i18n.lang() === 'es' ? es[service] : en[service];
  }
  serviceDetail(): string {
    const es = {
      web: 'Portal adaptable con navegación, contenido y formularios.',
      mobile: 'Experiencia móvil para iOS y Android.',
      cloud: 'Infraestructura escalable y despliegue continuo.',
      ai: 'Exploración de datos y modelos predictivos.',
    };
    const en = {
      web: 'A responsive portal with navigation, content and forms.',
      mobile: 'A mobile experience for iOS and Android.',
      cloud: 'Scalable infrastructure and continuous delivery.',
      ai: 'Data exploration and predictive models.',
    };
    return this.i18n.lang() === 'es' ? es[this.service()] : en[this.service()];
  }
  reset(): void {
    this.soilHumidity.set(36);
    this.temperature.set(25);
    this.quantity.set(2);
    this.orderStage.set(0);
    this.red.set(100);
    this.green.set(100);
    this.blue.set(100);
    this.service.set('web');
    this.studioStage.set(0);
    this.renderRgb();
  }
}
