import { canonicalLocale, localeChain } from './locale.js';
import type { Direction, I18n, LocaleSnapshot, Values } from './locale.js';
import { parseTranslationAttribute, TRANSLATABLE_ATTRIBUTES } from './attributes.js';
import type { TranslatableAttribute } from './attributes.js';
import { assertValidI18n, ownedElements } from './validate.js';
import type { BindOptions, I18nBinding, QueryRuntime, RenderContext } from './types.js';

export const I18N_CHANGE_EVENT = 'defuss-i18n:change';
const bindings = new WeakMap<Element, I18nBinding<unknown>>();
// VERIFIED: HTML serialization leaves raw-text contents unescaped, so a slot value could close its element (browser suite).
const RAW_TEXT = new Set(['script', 'style', 'xmp', 'iframe', 'noembed', 'noframes', 'noscript', 'plaintext']);
interface Source { readonly locale: string; readonly plural: string; readonly template: HTMLTemplateElement }
interface Region { readonly name: string; readonly target: Element; readonly sources: readonly Source[] }
interface AttributeWrite { readonly element: Element; readonly name: string; readonly value: string | null }
interface TextWrite { readonly element: Element; readonly value: string }

function assertValues(values: Values): void {
  for (const [key, value] of Object.entries(values)) {
    if (!['string', 'number', 'boolean'].includes(typeof value)) throw new TypeError(`defuss-i18n: ${key} must be a primitive interpolation value`);
  }
}
function interpolatePlan(elements: readonly Element[], values: Values): TextWrite[] {
  return elements.flatMap(element => {
    const key = element.getAttribute('data-i18n-value');
    if (key === null) return [];
    if (!Object.hasOwn(values, key)) throw new Error(`defuss-i18n: missing interpolation value ${key}`);
    if (element.children.length) throw new Error(`defuss-i18n: interpolation slot ${key} must contain text only`);
    if (RAW_TEXT.has(element.localName)) throw new Error(`defuss-i18n: interpolation slot ${key} cannot be a raw-text <${element.localName}>`);
    return [{ element, value: String(values[key]) }];
  });
}
function attributePlan(elements: readonly Element[], snapshot: LocaleSnapshot): AttributeWrite[] {
  const writes: AttributeWrite[] = [];
  for (const element of elements) {
    if (element.localName === 'template') continue;
    const variants = new Map<TranslatableAttribute, Map<string, string | null>>();
    const add = (name: TranslatableAttribute, locale: string, value: string | null): void => {
      const map = variants.get(name) ?? new Map<string, string | null>();
      if (map.has(locale)) throw new Error(`defuss-i18n: conflicting ${name}/${locale} variants`);
      map.set(locale, value); variants.set(name, map);
    };
    for (const attr of element.attributes) {
      const parsed = parseTranslationAttribute(attr.name);
      if (parsed) add(parsed.attribute, parsed.locale, attr.value);
      else if (attr.name.startsWith('data-i18n-remove-')) {
        const locale = canonicalLocale(attr.name.slice(17));
        for (const name of attr.value.split(/\s+/).filter(Boolean)) {
          if (!(TRANSLATABLE_ATTRIBUTES as readonly string[]).includes(name)) throw new Error(`defuss-i18n: cannot remove localized ${name}`);
          add(name as TranslatableAttribute, locale, null);
        }
      }
    }
    for (const [name, translations] of variants) {
      const selected = localeChain(snapshot.locale, snapshot.fallback).find(locale => translations.has(locale));
      if (!selected) throw new Error(`defuss-i18n: no ${name} variant for ${snapshot.locale}`);
      writes.push({ element, name, value: translations.get(selected)! });
    }
  }
  return writes;
}

export function createDomI18n(runtime: QueryRuntime) {
  if (typeof runtime !== 'function' || typeof runtime.morph !== 'function') {
    throw new Error('defuss-i18n: load defuss-morph and defuss-query (or defuss-shadcn core.js) first');
  }
  const writeAttributes = (writes: readonly AttributeWrite[]): void => {
    for (const { element, name, value } of writes) {
      if (value === null) { if (element.hasAttribute(name)) runtime(element).attr(name, null); }
      else if (element.getAttribute(name) !== value) runtime(element).attr(name, value);
    }
  };
  const writeTexts = (writes: readonly TextWrite[]): void => {
    for (const { element, value } of writes) if (element.textContent !== value) runtime(element).text(value);
  };
  function bind<S = undefined>(root: Element, controller: I18n, options: BindOptions<S> = {}): I18nBinding<S> {
    if (!root || root.nodeType !== 1) throw new TypeError('defuss-i18n: bind requires an Element');
    const existing = bindings.get(root);
    if (existing && !existing.disposed) throw new Error('defuss-i18n: component already bound; reuse or dispose its binding');
    existing?.dispose();
    if (controller.disposed) throw new Error('defuss-i18n: controller is disposed');
    // Explicit component marker is also the parent/child ownership boundary.
    let regions: Region[] = [];
    let disposed = false;
    let refreshing = false;
    let overrideValues: Values | undefined;
    let context: RenderContext<S> | undefined;
    let unsubscribe: () => void = () => {};
    const assertLive = (): void => {
      if (disposed || controller.disposed) throw new Error('defuss-i18n: binding or controller is disposed');
    };
    const scan = (): void => {
      if (options.render) {
        if (root.querySelector('[data-i18n-component]')) throw new Error('defuss-i18n: full renderer cannot own nested components');
        regions = []; return;
      }
      assertValidI18n(root);
      const elements = ownedElements(root);
      const sources = elements.filter(element => element.localName === 'template' && element.hasAttribute('data-i18n-for')) as HTMLTemplateElement[];
      regions = elements.filter(element => element.hasAttribute('data-i18n-target')).map(target => ({
        name: target.getAttribute('data-i18n-target')!, target,
        sources: sources.filter(source => source.getAttribute('data-i18n-for') === target.getAttribute('data-i18n-target')).map(source => ({
          locale: canonicalLocale(source.getAttribute('data-i18n-locale')!), plural: source.getAttribute('data-i18n-plural') ?? '',
          // Capture once. Switching never consumes/moves/mutates authoring sources.
          template: source.cloneNode(true) as HTMLTemplateElement,
        })),
      }));
    };
    const refresh = (): void => {
      assertLive();
      if (refreshing) throw new Error('defuss-i18n: reentrant binding refresh');
      refreshing = true;
      try {
        const EventConstructor = root.ownerDocument.defaultView?.CustomEvent;
        if (!EventConstructor) throw new Error('defuss-i18n: component document needs a CustomEvent constructor');
        const snapshot = controller.snapshot;
        const state = options.getState?.() as S;
        const values = overrideValues ?? (typeof options.values === 'function' ? options.values(state, snapshot) : options.values ?? {});
        assertValues(values);
        const nextContext: RenderContext<S> = Object.freeze({ state, values, snapshot, locale: snapshot.locale, i18n: controller, root, query: runtime });
        const plans: { target: Element; html: string; locale: string; direction: Direction }[] = [];
        if (options.render) {
          if (root.querySelector('[data-i18n-component]')) throw new Error('defuss-i18n: full renderer cannot own nested components');
          const html = options.render(nextContext);
          if (typeof html !== 'string') throw new TypeError('defuss-i18n: renderer must return an HTML string synchronously');
          const container = root.ownerDocument.createElement('template');
          container.innerHTML = html;
          if (container.content.querySelector('[data-i18n-component], template')) throw new Error('defuss-i18n: renderer cannot introduce nested components or templates');
          const children = Array.from(container.content.querySelectorAll('*'));
          writeAttributes(attributePlan(children, snapshot)); writeTexts(interpolatePlan(children, values));
          plans.push({ target: root, html: container.innerHTML, locale: snapshot.locale, direction: snapshot.direction });
        } else {
          for (const region of regions) {
            if (region.target !== root && !root.contains(region.target)) throw new Error('defuss-i18n: target was replaced; call binding.rescan()');
            const selectedLocale = controller.resolveLocale(region.sources.map(source => source.locale));
            if (!selectedLocale) throw new Error(`defuss-i18n: no template for ${region.name}/${snapshot.locale}`);
            const countKey = region.target.getAttribute('data-i18n-count');
            let category = '';
            if (countKey !== null) {
              const count = values[countKey];
              if (typeof count !== 'number' || !Number.isFinite(count)) throw new TypeError(`defuss-i18n: plural count ${countKey} must be a finite number`);
              category = new Intl.PluralRules(selectedLocale).select(count);
            }
            const source = region.sources.find(item => item.locale === selectedLocale && item.plural === category)
              ?? region.sources.find(item => item.locale === selectedLocale && item.plural === 'other');
            if (!source) throw new Error(`defuss-i18n: missing ${region.name}/${selectedLocale}/${category} variant`);
            const clone = source.template.cloneNode(true) as HTMLTemplateElement;
            const children = Array.from(clone.content.querySelectorAll('*'));
            writeAttributes(attributePlan(children, snapshot)); writeTexts(interpolatePlan(children, values));
            plans.push({ target: region.target, html: clone.innerHTML, locale: selectedLocale, direction: options.reflectLocale === false ? snapshot.direction : controller.directionFor(selectedLocale) });
          }
        }
        const owned = ownedElements(root).filter(element => element.localName !== 'template' &&
          !plans.some(plan => plan.target !== element && plan.target.contains(element)),
        );
        const attrs = attributePlan(owned, snapshot);
        const texts = interpolatePlan(owned.filter(element => !plans.some(plan => plan.target === element)), values);
        // All source selection/interpolation/attribute checks precede live writes.
        for (const plan of plans) {
          runtime(plan.target).html(plan.html);
          if (options.reflectLocale !== false) {
            runtime(plan.target).attr('lang', plan.locale);
            runtime(plan.target).attr('dir', plan.direction);
          }
        }
        writeAttributes(attrs); writeTexts(texts);
        if (options.reflectLocale !== false && !plans.some(plan => plan.target === root)) {
          runtime(root).attr('lang', snapshot.locale); runtime(root).attr('dir', snapshot.direction);
        }
        context = nextContext;
        const rendered = options.afterRender?.(nextContext) as unknown;
        if (rendered && typeof (rendered as { then?: unknown }).then === 'function') throw new TypeError('defuss-i18n: afterRender must be synchronous');
        const target = options.eventTarget ?? root;
        target.dispatchEvent(new EventConstructor(I18N_CHANGE_EVENT, { detail: Object.freeze({ snapshot, root }), bubbles: true }));
      } finally { refreshing = false; }
    };
    const api: I18nBinding<S> = {
      root, controller,
      get disposed() { return disposed || controller.disposed; }, get context() { return context; },
      refresh,
      setValues(values) {
        assertLive(); assertValues(values); const previous = overrideValues;
        overrideValues = Object.freeze({ ...values });
        // Restore only before live writes; once projected, the map is committed like a locale.
        try { refresh(); } catch (error) { if (context?.values !== overrideValues) overrideValues = previous; throw error; }
      },
      rescan() { assertLive(); scan(); refresh(); },
      dispose() { if (disposed) return; disposed = true; unsubscribe(); if (bindings.get(root) === api) bindings.delete(root); },
    };
    try {
      bindings.set(root, api as I18nBinding<unknown>);
      scan();
      runtime(root).attr('data-i18n-component', root.getAttribute('data-i18n-component') ?? '');
      unsubscribe = controller.subscribe(refresh, { phase: 'render' });
      refresh();
    } catch (error) { api.dispose(); throw error; }
    return api;
  }
  function mount(scope: ParentNode, controller: I18n): { bindings: readonly I18nBinding[]; dispose(): void } {
    const roots = Array.from(scope.querySelectorAll('[data-i18n-component]'));
    if ((scope as Node).nodeType === 1 && (scope as Element).hasAttribute('data-i18n-component')) roots.unshift(scope as Element);
    const mounted: I18nBinding[] = [];
    try { for (const root of roots) mounted.push(bind(root, controller)); }
    catch (error) { mounted.forEach(binding => binding.dispose()); throw error; }
    return { bindings: Object.freeze(mounted), dispose() { mounted.forEach(binding => binding.dispose()); } };
  }
  return Object.freeze({ bind, mount });
}
