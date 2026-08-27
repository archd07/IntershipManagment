/**
 * Generic trackBy for *ngFor loops over API-sourced lists.
 *
 * Without this, every poll/reload assigns a brand-new array of brand-new object
 * references (fresh JSON deserialized by HttpClient), and Angular's default
 * *ngFor diffing (identity-based) treats every item as removed-then-re-added,
 * destroying and recreating the DOM rows on every refresh. If that happens to
 * land between a user's mousedown and click (very likely once several
 * components are polling every few seconds), the click lands on an element
 * that no longer exists and appears to require a second click to register.
 * Tracking by `id` lets Angular reuse the existing DOM node instead.
 */
export function trackById<T extends { id: number }>(_index: number, item: T): number {
  return item.id;
}
