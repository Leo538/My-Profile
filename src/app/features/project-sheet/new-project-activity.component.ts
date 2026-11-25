import {
  ChangeDetectionStrategy,
  Component,
  OnChanges,
  computed,
  inject,
  input,
  signal,
} from '@angular/core';
import { LanguageService } from '../../core/services/language.service';
import {
  SlipperAction,
  advanceSlipperDemo,
  createSlipperDemo,
  recommendIotIrrigation,
} from './new-project-activity';

@Component({
  selector: 'app-new-project-activity',
  standalone: true,
  templateUrl: './new-project-activity.component.html',
  styleUrl: './new-project-activity.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NewProjectActivityComponent implements OnChanges {
  readonly projectId = input.required<'vinculacion' | 'pantufladas'>();
  readonly i18n = inject(LanguageService);
  readonly soil = signal(22);
  readonly rain = signal(20);
  readonly recommendation = computed(() => recommendIotIrrigation(this.soil(), this.rain()));
  readonly slippers = signal(createSlipperDemo());
  readonly step = computed(() =>
    ['awaiting', 'warehouse', 'transit', 'local', 'sold'].indexOf(this.slippers().stage),
  );
  readonly steps = computed(() =>
    this.i18n.lang() === 'es'
      ? ['Recibir lote', 'Despachar', 'Recibir en local', 'Vender']
      : ['Receive batch', 'Dispatch', 'Receive in store', 'Sell'],
  );
  readonly recommendationLabel = computed(() => {
    const labels = {
      irrigate: ['Regar ahora', 'Irrigate now'],
      wait: ['Esperar lluvia', 'Wait for rain'],
      adequate: ['No regar', 'Do not irrigate'],
      wet: ['No regar', 'Do not irrigate'],
      unavailable: ['Sin dato de suelo', 'No soil reading'],
    };
    const [es, en] = labels[this.recommendation()];
    return this.i18n.text(es, en);
  });
  readonly recommendedTime = computed(() => {
    switch (this.recommendation()) {
      case 'irrigate': return this.i18n.text('15–20 minutos', '15–20 minutes');
      case 'wait':
      case 'wet': return this.i18n.text('Revisar en 2 horas', 'Check in 2 hours');
      case 'adequate': return this.i18n.text('Revisar más tarde', 'Check again later');
      default: return this.i18n.text('No disponible', 'Unavailable');
    }
  });
  readonly recommendationReason = computed(() => {
    switch (this.recommendation()) {
      case 'irrigate': return this.i18n.text('Suelo bajo 30 % y lluvia bajo 40 %.', 'Soil below 30% and rain below 40%.');
      case 'wait': return this.i18n.text('Suelo bajo 30 %, con lluvia probable desde 40 %.', 'Soil below 30%, with rain probability of at least 40%.');
      case 'adequate': return this.i18n.text('La humedad entre 30 % y 60 % es adecuada.', 'Soil moisture between 30% and 60% is adequate.');
      case 'wet': return this.i18n.text('La humedad del suelo supera el 60 %.', 'Soil moisture is above 60%.');
      default: return this.i18n.text('Se necesita una lectura de humedad.', 'A soil moisture reading is required.');
    }
  });
  readonly nextLabel = computed(() =>
    (this.i18n.lang() === 'es'
      ? ['Recibir 12 pares', 'Despachar 6 pares', 'Recibir 6 pares en local', 'Vender 1 par · USD 18', 'Venta registrada']
      : ['Receive 12 pairs', 'Dispatch 6 pairs', 'Receive 6 pairs in store', 'Sell 1 pair · USD 18', 'Sale recorded'])[this.step()],
  );
  readonly stockHint = computed(() =>
    (this.i18n.lang() === 'es'
      ? ['Recibe un lote ficticio para iniciar.', 'El lote está en bodega. Envía la mitad al local.', 'El traslado está en camino. Confirma su llegada.', 'El local tiene 6 pares disponibles. Registra una venta.', '¡Negocio en marcha! 6 en bodega + 5 en local + 1 vendido.']
      : ['Receive a fictional batch to begin.', 'The batch is in the warehouse. Send half to the store.', 'The transfer is on the way. Confirm its arrival.', 'The store has 6 pairs available. Record one sale.', 'Business is running! 6 in warehouse + 5 in store + 1 sold.'])[this.step()],
  );

  ngOnChanges(): void { this.reset(); }

  setPercent(target: 'soil' | 'rain', event: Event): void {
    const value = Number((event.target as HTMLInputElement).value);
    if (Number.isFinite(value)) this[target].set(Math.max(0, Math.min(100, Math.round(value))));
  }

  advance(): void {
    const action = (['receive-batch', 'dispatch', 'receive-transfer', 'sell'] as SlipperAction[])[this.step()];
    if (action) this.slippers.update((state) => advanceSlipperDemo(state, action));
  }

  money(cents: number): string {
    return new Intl.NumberFormat(this.i18n.locale(), { style: 'currency', currency: 'USD' }).format(cents / 100);
  }

  reset(): void {
    this.soil.set(22);
    this.rain.set(20);
    this.slippers.set(createSlipperDemo());
  }
}
