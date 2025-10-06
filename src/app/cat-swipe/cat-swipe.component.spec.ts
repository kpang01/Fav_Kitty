import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { CatSwipeComponent } from './cat-swipe.component';
import { CataasService } from '../services/cataas.service';
import { HttpClientTestingModule } from '@angular/common/http/testing';

describe('CatSwipeComponent', () => {
  let component: CatSwipeComponent;
  let fixture: ComponentFixture<CatSwipeComponent>;
  let svc: CataasService;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [CatSwipeComponent],
      imports: [HttpClientTestingModule],
      providers: [CataasService]
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CatSwipeComponent);
    component = fixture.componentInstance;
    svc = TestBed.inject(CataasService);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('preloads a few images on init', () => {
    // initial preload will attempt to set imageLoaded entries
    expect(component.cards.length).toBeGreaterThan(0);
  });

  it('swiping right moves card to liked', () => {
    const initialCount = component.cards.length;
    component.swipeRight();
    expect(component.cards.length).toBe(initialCount - 1);
    expect(component.liked.length).toBe(1);
  });

  it('swiping left moves card to disliked', () => {
    const initialCount = component.cards.length;
    component.swipeLeft();
    expect(component.cards.length).toBe(initialCount - 1);
    expect(component.disliked.length).toBe(1);
  });

  it('resetting repopulates cards', () => {
    component.swipeLeft();
    component.swipeRight();
    component.reset();
    expect(component.cards.length).toBe(12);
    expect(component.liked.length).toBe(0);
    expect(component.disliked.length).toBe(0);
  });

  it('unliking a card returns it to the deck', () => {
    // First, like a card
    const cardToLike = component.cards[0];
    component.swipeRight();
    expect(component.liked.length).toBe(1);

    // Now, unlike it
    component.unlike(0);
    expect(component.liked.length).toBe(0);
    expect(component.cards[0]).toBe(cardToLike);
  });
});
