import { DestroyRef } from '@angular/core';
import { Observable, interval } from 'rxjs';
import { startWith, switchMap } from 'rxjs/operators';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

/**
 * Polls `fetchFn` immediately and then every `intervalMs`, stopping automatically
 * when the calling component is destroyed. Used in place of a websocket/SSE
 * connection to keep lists and counters (notifications, requests, complaints...)
 * up to date without requiring a manual page refresh.
 */
export function poll<T>(fetchFn: () => Observable<T>, destroyRef: DestroyRef, intervalMs = 5000): Observable<T> {
  return interval(intervalMs).pipe(
    startWith(0),
    switchMap(() => fetchFn()),
    takeUntilDestroyed(destroyRef)
  );
}
