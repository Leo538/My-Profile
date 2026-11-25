import {
  AfterViewInit,
  Component,
  ElementRef,
  HostListener,
  NgZone,
  OnDestroy,
  ViewChild,
  inject,
  signal,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { Diagnosis, StationChallenge } from './challenge';
import type { StationScene } from './station-scene';

@Component({
  selector: 'app-explore',
  imports: [RouterLink],
  templateUrl: './explore.component.html',
  styleUrls: ['./explore.component.css', './terminal-dialog.css'],
})
export class ExploreComponent implements AfterViewInit, OnDestroy {
  @ViewChild('viewport', { static: true }) viewport!: ElementRef<HTMLElement>;
  @ViewChild('terminal', { static: true }) terminal!: ElementRef<HTMLDialogElement>;
  private readonly zone = inject(NgZone);
  private scene?: StationScene;
  private destroyed = false;
  readonly challenge = new StationChallenge();
  readonly near = signal(false);
  readonly ready = signal(false);
  readonly error = signal('');
  readonly solved = signal(false);
  readonly feedback = signal('');

  async ngAfterViewInit(): Promise<void> {
    try {
      const { StationScene } = await import('./station-scene');
      if (this.destroyed) return;
      this.zone.runOutsideAngular(() => {
        this.scene = new StationScene(this.viewport.nativeElement, (near) =>
          this.zone.run(() => this.near.set(near)),
        );
      });
      this.ready.set(true);
    } catch {
      this.error.set(
        'La escena necesita WebGL. Activa la aceleración gráfica del navegador y vuelve a cargar la página.',
      );
    }
  }

  @HostListener('window:keydown', ['$event'])
  onKeyDown(event: KeyboardEvent): void {
    if (this.terminal.nativeElement.open || event.ctrlKey || event.metaKey || event.altKey) return;
    const key = event.key.toLowerCase();
    if (['w', 'a', 's', 'd', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright', 'e'].includes(key))
      event.preventDefault();
    this.scene?.setKey(key, true);
    if (key === 'e' && !event.repeat) this.inspect();
  }

  @HostListener('window:keyup', ['$event'])
  onKeyUp(event: KeyboardEvent): void {
    this.scene?.setKey(event.key, false);
  }

  @HostListener('window:blur')
  @HostListener('document:visibilitychange')
  clearKeys(): void {
    this.scene?.clearKeys();
  }

  move(event: PointerEvent, key: string): void {
    event.preventDefault();
    (event.currentTarget as HTMLElement).setPointerCapture(event.pointerId);
    this.scene?.setKey(key, true);
  }

  release(key: string): void {
    this.scene?.setKey(key, false);
  }

  inspect(): void {
    if (!this.near() || this.terminal.nativeElement.open) return;
    this.scene?.setPaused(true);
    this.terminal.nativeElement.showModal();
  }

  close(): void {
    this.terminal.nativeElement.close();
    this.scene?.setPaused(false);
  }

  resume(): void {
    this.scene?.setPaused(false);
  }

  answer(answer: Diagnosis): void {
    this.challenge.answer(answer);
    this.solved.set(this.challenge.solved);
    this.feedback.set(this.challenge.feedback);
    this.scene?.setSolved(this.challenge.solved);
  }

  reset(): void {
    this.close();
    this.challenge.reset();
    this.solved.set(false);
    this.feedback.set('');
    this.near.set(false);
    this.scene?.reset();
  }

  ngOnDestroy(): void {
    this.destroyed = true;
    this.terminal.nativeElement.close();
    this.scene?.dispose();
  }
}
