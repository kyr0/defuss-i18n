import { canonicalLocale } from './locale.js';
import { parseTranslationAttribute } from './attributes.js';
import type { Diagnostic, ValidationOptions } from './types.js';

const controls = new Set(['component', 'target', 'for', 'locale', 'plural', 'count', 'value']);
export const PLURAL_CATEGORIES = new Set(['zero', 'one', 'two', 'few', 'many', 'other']);

/** Include root, but never cross a nested component boundary or template content. */
export function ownedElements(root: Element): Element[] {
  return [root, ...root.querySelectorAll('*')].filter(element => {
    const boundary = element.closest('[data-i18n-component]');
    return element === root || boundary === root || !boundary || !root.contains(boundary);
  });
}

export function validateI18n(root: Element, options: ValidationOptions = {}): Diagnostic[] {
  const issues: Diagnostic[] = [];
  const report = (code: string, message: string, element: Element): void => { issues.push({ code, message, element }); };
  const targets = new Map<string, Element>();
  const variants = new Map<string, Set<string>>();
  const identities = new Map<string, Map<string, string>>();
  const elements = ownedElements(root);
  // VERIFIED: document lookups miss shadow roots (browser suite), so resolve IDs in the root's own tree, detached subtrees included.
  const tree = root.getRootNode() as Element | Document | ShadowRoot;
  const byId = (id: string): Element | null => 'getElementById' in tree
    ? tree.getElementById(id) : [tree, ...tree.querySelectorAll('[id]')].find(element => element.id === id) ?? null;
  const validateContent = (element: Element): void => {
    const translations = new Map<string, Set<string>>();
    const record = (attribute: string, locale: string): void => {
      const locales = translations.get(attribute) ?? new Set<string>();
      if (locales.has(locale)) report('CONFLICTING_ATTRIBUTE', `conflicting ${attribute}/${locale} variants`, element);
      locales.add(locale); translations.set(attribute, locales);
    };
    for (const attr of element.attributes) {
      if (!attr.name.startsWith('data-i18n-')) continue;
      const suffix = attr.name.slice(10);
      if (controls.has(suffix)) continue;
      if (suffix.startsWith('remove-')) {
        let locale: string;
        try { locale = canonicalLocale(suffix.slice(7)); } catch { report('INVALID_LOCALE', `Invalid locale in ${attr.name}`, element); continue; }
        for (const name of attr.value.split(/\s+/).filter(Boolean)) {
          if (!parseTranslationAttribute(`data-i18n-${name}-en`)) report('UNSUPPORTED_ATTRIBUTE', `Cannot localize ${name}`, element);
          else record(name, locale);
        }
        continue;
      }
      try {
        const parsed = parseTranslationAttribute(attr.name);
        if (!parsed) report('UNSUPPORTED_ATTRIBUTE', `Unknown or non-content translation attribute ${attr.name}`, element);
        else record(parsed.attribute, parsed.locale);
      } catch { report('INVALID_LOCALE', `Invalid locale in ${attr.name}`, element); }
    }
    for (const [attribute, locales] of translations) {
      for (const locale of options.locales ?? []) {
        if (!locales.has(canonicalLocale(locale))) report('MISSING_ATTRIBUTE_LOCALE', `${attribute} lacks ${canonicalLocale(locale)}`, element);
      }
    }
    const value = element.getAttribute('data-i18n-value');
    if (value !== null && (!value || (options.values && !options.values.includes(value)))) {
      report('UNKNOWN_VALUE', `Missing declared interpolation value ${value}`, element);
    }
  };
  for (const element of elements) {
    validateContent(element);
    const target = element.getAttribute('data-i18n-target');
    if (target !== null) {
      if (!target) report('EMPTY_TARGET', 'Translation targets need a non-empty name', element);
      if (targets.has(target)) report('DUPLICATE_TARGET', `Duplicate target ${target}`, element);
      targets.set(target, element);
      if (element.localName === 'template') report('INVALID_TARGET', 'A template cannot be a live translation target', element);
      if (element.querySelector('[data-i18n-component]')) report('NESTED_OWNERSHIP', `Target ${target} contains another component`, element);
      const ancestor = element.parentElement?.closest('[data-i18n-target]');
      if (ancestor && (ancestor === root || ancestor.closest('[data-i18n-component]') === root)) {
        report('OVERLAPPING_TARGET', 'Translation targets must not overlap', element);
      }
    }
    const sourceFor = element.getAttribute('data-i18n-for');
    if (sourceFor === null) continue;
    if (element.localName !== 'template') { report('INVALID_SOURCE', 'Translation sources must be template elements', element); continue; }
    let locale: string;
    try { locale = canonicalLocale(element.getAttribute('data-i18n-locale') ?? ''); }
    catch { report('INVALID_LOCALE', 'Template needs a valid data-i18n-locale', element); continue; }
    const plural = element.getAttribute('data-i18n-plural') ?? '';
    if (plural && !PLURAL_CATEGORIES.has(plural)) report('INVALID_PLURAL', `Invalid plural category ${plural}`, element);
    const key = `${locale}:${plural}`;
    const entries = variants.get(sourceFor) ?? new Set<string>();
    if (entries.has(key)) report('DUPLICATE_VARIANT', `Duplicate ${sourceFor}/${key}`, element);
    entries.add(key);
    variants.set(sourceFor, entries);
    const content = (element as HTMLTemplateElement).content;
    if (content.querySelector('template')) report('NESTED_TEMPLATE', 'Nested templates are not supported by the morph peer', element);
    if (content.querySelector('[data-i18n-component], [data-i18n-target]')) report('NESTED_OWNERSHIP', 'Sources cannot introduce nested localization ownership', element);
    const ids = new Set<string>();
    const keys = new Set<string>();
    const group = `${sourceFor}:${plural}`;
    const seenIdentities = identities.get(group) ?? new Map<string, string>();
    for (const child of content.querySelectorAll('*')) {
      validateContent(child);
      if (child.id) {
        if (ids.has(child.id)) report('DUPLICATE_ID', `Duplicate source id ${child.id}`, child);
        ids.add(child.id);
      }
      const siblingKey = child.getAttribute('key');
      const identityKeys = child.id ? [`id:${child.id}`] : [];
      if (siblingKey !== null) {
        const ancestry: string[] = [];
        let parent = child.parentElement;
        while (parent) {
          const siblings = Array.from(parent.parentNode?.childNodes ?? []).filter(node => node.nodeType === 1);
          ancestry.unshift(parent.id ? `id:${parent.id}` : parent.hasAttribute('key') ? `key:${parent.getAttribute('key')}` : `${parent.localName}:${siblings.indexOf(parent)}`);
          parent = parent.parentElement;
        }
        identityKeys.push(`key:${ancestry.join('/')}/${siblingKey}`);
      }
      for (const identity of identityKeys) {
        const previousTag = seenIdentities.get(identity);
        if (previousTag && previousTag !== child.localName) report('IDENTITY_TAG_MISMATCH', `${identity} changes tag from ${previousTag} to ${child.localName}`, child);
        else seenIdentities.set(identity, child.localName);
      }
      // Keys are scoped to siblings by morph, not to an entire template.
      if (siblingKey !== null) {
        const siblings = Array.from(child.parentNode?.childNodes ?? []).filter(node => node.nodeType === 1) as Element[];
        if (siblings.filter(sibling => sibling.getAttribute('key') === siblingKey).length > 1 && !keys.has(siblingKey)) {
          report('DUPLICATE_KEY', `Duplicate sibling key ${siblingKey}`, child); keys.add(siblingKey);
        }
      }
    }
    identities.set(group, seenIdentities);
    for (const child of content.querySelectorAll('[aria-labelledby], [aria-describedby], label[for]')) {
      for (const attr of ['aria-labelledby', 'aria-describedby', 'for']) {
        for (const id of (child.getAttribute(attr) ?? '').split(/\s+/).filter(Boolean)) {
          const existing = byId(id);
          const liveTarget = elements.find(element => element.getAttribute('data-i18n-target') === sourceFor);
          const external = existing && (existing === liveTarget || !liveTarget?.contains(existing));
          if (!ids.has(id) && !external) report('MISSING_ID_REFERENCE', `Unresolved ${attr} reference ${id}`, child);
        }
      }
    }
  }
  for (const [name, target] of targets) {
    const entries = variants.get(name);
    if (!entries?.size) report('MISSING_SOURCE', `Target ${name} has no templates`, target);
    const count = target.getAttribute('data-i18n-count');
    if (count !== null && (!count || (options.values && !options.values.includes(count)))) report('UNKNOWN_VALUE', `Missing plural count ${count}`, target);
    for (const locale of options.locales ?? []) {
      const canonical = canonicalLocale(locale);
      const plain = entries?.has(`${canonical}:`);
      const other = entries?.has(`${canonical}:other`);
      if (count !== null ? !other : !plain) report('MISSING_LOCALE', `Target ${name} lacks ${canonical}${count !== null ? '/other' : ''}`, target);
    }
    if (entries) {
      const localeTags = new Set(Array.from(entries, entry => entry.split(':')[0]!));
      for (const locale of localeTags) {
        const hasPlural = Array.from(entries).some(entry => entry.startsWith(`${locale}:`) && !entry.endsWith(':'));
        if (count === null && hasPlural) report('MISSING_COUNT', `Plural variants for ${name} require data-i18n-count`, target);
        if (count !== null && (!entries.has(`${locale}:other`) || entries.has(`${locale}:`))) {
          report('INVALID_PLURAL_SET', `${name}/${locale} requires other and no unqualified variant`, target);
        }
      }
    }
  }
  for (const name of variants.keys()) if (!targets.has(name)) report('MISSING_TARGET', `Templates refer to missing target ${name}`, root);
  for (const element of elements.filter(element => element.localName === 'template' && element.hasAttribute('data-i18n-for'))) {
    const sourceFor = element.getAttribute('data-i18n-for')!;
    const target = targets.get(sourceFor);
    if (target?.contains(element)) report('SOURCE_INSIDE_TARGET', `Template for ${sourceFor} would be removed by its own morph`, element);
  }
  return issues;
}

export function assertValidI18n(root: Element, options?: ValidationOptions): void {
  const issues = validateI18n(root, options);
  if (issues.length) throw new Error(`defuss-i18n: invalid component\n${issues.map(issue => `${issue.code}: ${issue.message}`).join('\n')}`);
}
