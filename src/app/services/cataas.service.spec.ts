import { TestBed } from '@angular/core/testing';
import { CataasService } from './cataas.service';
import { HttpClientTestingModule } from '@angular/common/http/testing';

describe('CataasService', () => {
  let service: CataasService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule]
    });
    service = TestBed.inject(CataasService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('returns correct number of urls', () => {
    const urls = service.getCatUrls(5);
    expect(urls.length).toBe(5);
    expect(urls.every(u => u.startsWith('https://'))).toBeTrue();
  });

  it('returns 10 urls by default', () => {
    const urls = service.getCatUrls();
    expect(urls.length).toBe(10);
  });

  it('generates well-formed urls', () => {
    const urls = service.getCatUrls(1);
    const url = urls[0];
    expect(url).toMatch(/^https:\/\/cataas\.com\/cat\?width=800&height=800&timestamp=\d+$/);
  });
});
