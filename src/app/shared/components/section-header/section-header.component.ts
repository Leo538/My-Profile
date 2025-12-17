import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-section-header',
  standalone: true,
  template: `
    <div class="flex items-baseline gap-4 mb-12">
      <span class="text-2xl sm:text-3xl font-bold text-black/20 tabular-nums">
        {{ number }}
      </span>
      <h2 class="text-3xl sm:text-4xl lg:text-5xl font-bold">
        {{ title }}
      </h2>
    </div>
  `,
  styles: []
})
export class SectionHeaderComponent {
  @Input({ required: true }) number!: string;
  @Input({ required: true }) title!: string;
}

