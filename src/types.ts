import type { I18n, LocaleSnapshot, Values } from './locale.js';
/** Structural dependency injection boundary, satisfied by the real df$ runtime. */
export interface QuerySelection {
  html(content: string): unknown;
  text(content: string): unknown;
  attr(name: string, value: string | null): unknown;
  prop(name: string, value: unknown): unknown;
}
export interface QueryRuntime {
  (element: Element): QuerySelection;
  morph?: unknown;
}
export interface RenderContext<S> {
  readonly state: S;
  readonly locale: string;
  readonly snapshot: LocaleSnapshot;
  readonly i18n: I18n;
  readonly values: Values;
  readonly root: Element;
  readonly query: QueryRuntime;
}
export interface BindOptions<S = undefined> {
  getState?: () => S;
  values?: Values | ((state: S, snapshot: LocaleSnapshot) => Values);
  render?: (context: RenderContext<S>) => string;
  afterRender?: (context: RenderContext<S>) => void;
  reflectLocale?: boolean;
  eventTarget?: EventTarget;
}
export interface I18nBinding<S = undefined> {
  readonly root: Element;
  readonly controller: I18n;
  readonly disposed: boolean;
  refresh(): void;
  setValues(values: Values): void;
  rescan(): void;
  dispose(): void;
  /** Last state snapshot supplied to the renderer. */
  readonly context: RenderContext<S> | undefined;
}
export interface Diagnostic {
  readonly code: string;
  readonly message: string;
  readonly element: Element;
}
export interface ValidationOptions { locales?: readonly string[]; values?: readonly string[] }
