import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { CataasService } from '../services/cataas.service';

interface CatCard {
  url: string;
  id: number;
}

@Component({
  selector: 'app-cat-swipe',
  templateUrl: './cat-swipe.component.html',
  styleUrls: ['./cat-swipe.component.css']
})
export class CatSwipeComponent implements OnInit {
  @ViewChild('stack', { static: false }) stackRef?: ElementRef<HTMLElement>;
  // for screen-reader announcements
  @ViewChild('announcer') announcerRef?: ElementRef<HTMLDivElement>;
  cards: CatCard[] = [];
  liked: CatCard[] = [];
  disliked: CatCard[] = [];

  // drag state for top card
  dragging = false;
  dragX = 0;
  dragY = 0;
  // start positions for the current drag (stored on component so different events can read them)
  private dragStartX = 0;
  private dragStartY = 0;
  transition = '';

  // preload tracking
  imageLoaded = new Map<number, boolean>();

  // persistence
  private storageKey = 'paws-liked';

  private threshold = 100;

  constructor(private cataas: CataasService) {}

  ngOnInit(): void {
    // load persisted likes
    const persisted = localStorage.getItem(this.storageKey);
    if (persisted) {
      try {
        this.liked = JSON.parse(persisted) as CatCard[];
      } catch { this.liked = []; }
    }

    const urls = this.cataas.getCatUrls(12);
    this.cards = urls.map((u, i) => ({ url: u, id: i }));

    // start preloading first few images
    this.preloadWindow(0);
  }

  onKeydown(evt: KeyboardEvent) {
    if (evt.key === 'ArrowRight') {
      evt.preventDefault();
      if (this.cards.length) this.swipeRight();
    } else if (evt.key === 'ArrowLeft') {
      evt.preventDefault();
      if (this.cards.length) this.swipeLeft();
    }
  }

  onFocus() {
    // for future: set a focused state if needed
  }

  onBlur() {
    // clear focus visuals if we set any state
  }

  // Preload images around current index
  private preloadWindow(startIndex: number) {
    const windowSize = 4;
    for (let i = startIndex; i < Math.min(this.cards.length, startIndex + windowSize); i++) {
      const id = this.cards[i].id;
      if (!this.imageLoaded.get(id)) {
        this.preloadImage(this.cards[i].url, id).catch(() => {
          this.imageLoaded.set(id, false);
        });
      }
    }
  }

  private preloadImage(url: string, id: number): Promise<void> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        this.imageLoaded.set(id, true);
        resolve();
      };
      img.onerror = () => {
        this.imageLoaded.set(id, false);
        reject();
      };
      img.src = url;
    });
  }

  startDrag(evt: PointerEvent | TouchEvent | MouseEvent) {
    this.dragging = true;
    this.transition = '';
    const x = this.getEventX(evt);
    const y = this.getEventY(evt);
    // set base positions
    this.dragX = 0;
    this.dragY = 0;
    // store start positions on the component so subsequent move events (which may be
    // different event objects) can read the same origin.
    this.dragStartX = x;
    this.dragStartY = y;
  }

  moveDrag(evt: PointerEvent | TouchEvent | MouseEvent) {
    if (!this.dragging) return;
    const x = this.getEventX(evt);
    const y = this.getEventY(evt);
    const startX = this.dragStartX ?? 0;
    const startY = this.dragStartY ?? 0;
    this.dragX = x - startX;
    this.dragY = y - startY;
  }

  endDrag() {
    if (!this.dragging) return;
    this.dragging = false;
    // decide
    if (this.dragX > this.threshold) {
      this.animateOut('right');
    } else if (this.dragX < -this.threshold) {
      this.animateOut('left');
    } else {
      // snap back
      this.transition = 'transform 220ms cubic-bezier(.2,.9,.2,1)';
      this.dragX = 0;
      this.dragY = 0;
    }
    // clear start positions
    this.dragStartX = 0;
    this.dragStartY = 0;
  }

  private animateOut(dir: 'left'|'right') {
    this.transition = 'transform 350ms ease-out, opacity 350ms ease-out';
    // move far off-screen
    const sign = dir === 'right' ? 1 : -1;
    this.dragX = sign * (window.innerWidth || 1000);
    this.dragY += 30;

    // after animation, actually remove card and record like/dislike
    setTimeout(() => {
      const card = this.cards.shift();
      if (!card) return;
      if (dir === 'right') {
        this.liked.push(card);
        this.persistLikes();
      } else {
        this.disliked.push(card);
      }
      // reset drag state for next card
      this.transition = '';
      this.dragX = 0;
      this.dragY = 0;
      // preload next window
      this.preloadWindow(0);
    }, 360);
  }

  // programmatic swipes (buttons or quick triggers)
  swipeRight() { this.animateOut('right'); }
  swipeLeft() { this.animateOut('left'); }

  reset() {
    this.liked = [];
    localStorage.removeItem(this.storageKey);
    const urls = this.cataas.getCatUrls(12);
    this.cards = urls.map((u, i) => ({ url: u, id: i }));
    this.imageLoaded.clear();
    this.preloadWindow(0);
  }

  unlike(likedIndex: number) {
    // remove from liked and insert at top of deck
    if (likedIndex < 0 || likedIndex >= this.liked.length) return;
    const card = this.liked.splice(likedIndex, 1)[0];
    // put card at the front of the deck
    this.cards.unshift(card);
    // mark image as loaded (so placeholder won't show)
    this.imageLoaded.set(card.id, true);
    this.persistLikes();
    // announce to screen readers
    this.announce('Removed from likes and returned to deck');
  // focus the stack so keyboard users can continue; use rAF for reliability
  requestAnimationFrame(() => requestAnimationFrame(() => { this.stackRef?.nativeElement?.focus(); }));
  }

  announce(message: string) {
    try {
      if (this.announcerRef && this.announcerRef.nativeElement) {
        const el = this.announcerRef.nativeElement;
        el.textContent = '';
        // small delay to ensure change is picked up by SR
        setTimeout(() => (el.textContent = message), 50);
      }
    } catch (e) {
      // ignore - best-effort
    }
  }

  private persistLikes() {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(this.liked));
    } catch {}
  }

  // helpers
  getEventX(evt: any) {
    if (evt instanceof TouchEvent) return evt.touches[0]?.clientX ?? evt.changedTouches[0]?.clientX ?? 0;
    return evt.clientX ?? evt.pageX ?? 0;
  }

  getEventY(evt: any) {
    if (evt instanceof TouchEvent) return evt.touches[0]?.clientY ?? evt.changedTouches[0]?.clientY ?? 0;
    return evt.clientY ?? evt.pageY ?? 0;
  }

  // style helpers for template
  getCardStyle(index: number) {
    const baseZ = this.cards.length - index;
    const isTop = index === 0;
    let transform = '';
    let transition = this.transition;
    if (isTop) {
      transform = `translate(${this.dragX}px, ${this.dragY}px) rotate(${this.dragX / 20}deg)`;
    } else {
      // stacked scaling and offset. If it's the immediate next card, apply a scale
      // based on drag progress so it appears to grow while the top card is dragged.
      const nextCardIndex = 1;
      const baseScale = 1 - Math.min(0.08 * index, 0.22);
      const y = 12 * index;
      if (index === nextCardIndex) {
        const progress = Math.min(Math.abs(this.dragX) / 300, 1);
        const scale = baseScale + 0.08 * progress; // grow slightly
        const translateY = y - 8 * progress; // move up a bit
        transform = `translateY(${translateY}px) scale(${scale})`;
      } else {
        const scale = baseScale;
        transform = `translateY(${y}px) scale(${scale})`;
      }
    }
    return {
      transform,
      transition,
      zIndex: baseZ
    } as any;
  }

  badgeOpacity() {
    return Math.min(Math.abs(this.dragX) / 120, 1);
  }
}
