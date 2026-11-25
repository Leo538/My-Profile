import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  input,
  signal,
} from '@angular/core';
import { ProjectImage } from '../../core/data/projects.data';
import { LanguageService } from '../../core/services/language.service';

@Component({
  selector: 'app-project-gallery',
  standalone: true,
  templateUrl: './project-gallery.component.html',
  styleUrl: './project-gallery.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'sheet-preview project-gallery' },
})
export class ProjectGalleryComponent {
  readonly i18n = inject(LanguageService);
  readonly images = input.required<readonly ProjectImage[]>();
  readonly projectName = input.required<string>();
  readonly index = signal(0);
  readonly currentImage = computed(() => this.images()[this.index()]);
  readonly imageReady = signal(false);
  private pointer?: { id: number; x: number; y: number };

  constructor() {
    effect(() => {
      this.images();
      this.index.set(0);
      this.imageReady.set(false);
    });
  }

  selectImage(index: number): void {
    if (index >= 0 && index < this.images().length && index !== this.index()) {
      this.imageReady.set(false);
      this.index.set(index);
    }
  }

  move(delta: number): void {
    const count = this.images().length;
    if (count > 1) this.selectImage((this.index() + delta + count) % count);
  }

  onKeyDown(event: KeyboardEvent): void {
    if (event.ctrlKey || event.altKey || event.metaKey) return;
    if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
    event.preventDefault();
    event.stopPropagation();
    if (event.key === 'Home') this.selectImage(0);
    else if (event.key === 'End') this.selectImage(this.images().length - 1);
    else this.move(event.key === 'ArrowRight' ? 1 : -1);
  }

  pointerDown(event: PointerEvent): void {
    if (!event.isPrimary || event.pointerType === 'mouse') return;
    this.pointer = { id: event.pointerId, x: event.clientX, y: event.clientY };
    (event.currentTarget as HTMLElement).setPointerCapture(event.pointerId);
  }

  pointerUp(event: PointerEvent): void {
    const start = this.pointer;
    this.pointer = undefined;
    if (!start || start.id !== event.pointerId) return;
    const dx = event.clientX - start.x;
    const dy = event.clientY - start.y;
    if (Math.abs(dx) >= 45 && Math.abs(dx) > Math.abs(dy) * 1.3) this.move(dx < 0 ? 1 : -1);
  }

  cancelPointer(): void {
    this.pointer = undefined;
  }
}
