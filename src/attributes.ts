import { canonicalLocale, localeChain } from './locale.js';

/** Content attributes only. ARIA state and ID-reference attributes are deliberately absent. */
export const TRANSLATABLE_ATTRIBUTES = Object.freeze([
  'aria-roledescription', 'aria-description', 'aria-placeholder', 'aria-valuetext', 'aria-label',
  'placeholder', 'download', 'srcset', 'poster', 'title', 'sizes', 'label', 'alt', 'src', 'href', 'content',
] as const);
export type TranslatableAttribute = typeof TRANSLATABLE_ATTRIBUTES[number];
const ordered = [...TRANSLATABLE_ATTRIBUTES].sort((a, b) => b.length - a.length);
export interface AttributeVariant { readonly attribute: TranslatableAttribute; readonly locale: string }

export function parseTranslationAttribute(name: string): AttributeVariant | undefined {
  if (!name.startsWith('data-i18n-')) return undefined;
  const rest = name.slice(10);
  for (const attribute of ordered) {
    const prefix = `${attribute}-`;
    if (rest.startsWith(prefix)) return { attribute, locale: canonicalLocale(rest.slice(prefix.length)) };
  }
  return undefined;
}

export function chooseAttribute(
  variants: ReadonlyMap<string, string>, locale: string, fallback: readonly string[],
): string | undefined {
  for (const tag of localeChain(locale, fallback)) if (variants.has(tag)) return variants.get(tag);
  return undefined;
}
