import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})
export class CataasService {
  // Base URL for Cataas image resource
  private base = 'https://cataas.com';

  constructor(private http: HttpClient) {}

  // Return a simple list of image URLs (random cats). We create multiple URLs
  // which the component will load directly as <img src="...">. Cataas supports
  // caching-busting by adding a timestamp query param when needed.
  getCatUrls(count: number = 10): string[] {
    const urls: string[] = [];
    for (let i = 0; i < count; i++) {
      // Use /cat?type=... endpoints. We'll request a fixed size for consistency.
      const ts = Date.now() + i;
      urls.push(`${this.base}/cat?width=800&height=800&timestamp=${ts}`);
    }
    return urls;
  }
}
