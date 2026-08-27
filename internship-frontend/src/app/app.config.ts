import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { routes } from './app.routes';
import { authInterceptor } from './core/interceptors/auth.interceptor';

export const appConfig: ApplicationConfig = {
  providers: [
    // Explicitly enable zone-based change detection. Without this, some
    // builds silently fail to re-render the view after an async HTTP
    // response resolves (the component's data updates internally, but the
    // DOM only catches up on the next unrelated click/event) — this is what
    // was causing pages to require a second click before showing real data.
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    provideHttpClient(withInterceptors([authInterceptor]))
  ]
};
