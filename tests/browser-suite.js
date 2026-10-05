/** Real-browser behavior suite; executed unchanged against every shipping format. */
export async function run(api, query) {
  const results = [];
  const fixture = document.getElementById('fixture');
  const eq = (actual, expected) => { if (actual !== expected) throw Error(`Expected ${JSON.stringify(expected)}, received ${JSON.stringify(actual)}`); };
  const ok = (value, message = 'Expected truthy value') => { if (!value) throw Error(message); };
  const throws = (fn, pattern) => { let caught; try { fn(); } catch (error) { caught = error; } if (!caught || !pattern.test(caught.message)) throw Error(`Expected ${pattern}; received ${caught?.message}`); };
  const test = async (name, fn) => {
    fixture.innerHTML = '';
    const cleanup = [];
    const own = object => { cleanup.push(() => object.dispose()); return object; };
    const root = markup => { fixture.innerHTML = markup; return fixture.firstElementChild; };
    try { await fn({ root, own }); results.push({ name }); }
    catch (error) { results.push({ name, error: error.stack ?? error.message }); }
    finally { for (const dispose of cleanup.reverse()) dispose(); }
  };
  const basic = `<section data-i18n-component><div data-i18n-target="body"><h2 key="heading">Welcome</h2><button key="action">Save</button><img key="image" src="/en.png" alt="English"></div><template data-i18n-for="body" data-i18n-locale="en"><h2 key="heading">Welcome</h2><button key="action">Save</button><img key="image" src="/en.png" alt="English"></template><template data-i18n-for="body" data-i18n-locale="de"><h2 key="heading">Willkommen</h2><button key="action">Speichern</button><img key="image" src="/de.png" alt="Deutsch"></template></section>`;

  await test('template morph preserves identity, native listeners and source fragments', ({ root, own }) => {
    const element = root(basic); const i = own(api.createI18n()); const button = element.querySelector('button'); const image = element.querySelector('img'); let clicks = 0;
    button.addEventListener('click', () => clicks++); const originalSources = [...element.querySelectorAll('template')].map(t => t.innerHTML).join('');
    own(api.bind(element, i)); i.setLocale('de'); eq(element.querySelector('h2').textContent, 'Willkommen'); eq(element.querySelector('img'), image); eq(image.getAttribute('src'), '/de.png'); eq(image.alt, 'Deutsch');
    eq(element.querySelector('button'), button); button.click(); eq(clicks, 1);
    i.setLocale('en'); eq(element.querySelector('h2').textContent, 'Welcome'); eq([...element.querySelectorAll('template')].map(t => t.innerHTML).join(''), originalSources);
  });
  await test('imperative dialog remains modal with edited input and focus', ({ root, own }) => {
    const el = root(`<dialog data-i18n-component><input id="field"><div data-i18n-target="label">Settings</div><template data-i18n-for="label" data-i18n-locale="en">Settings</template><template data-i18n-for="label" data-i18n-locale="de">Einstellungen</template></dialog>`);
    const i = own(api.createI18n()); own(api.bind(el, i)); el.showModal(); const input = el.querySelector('input'); input.value = 'user state'; input.focus(); input.setSelectionRange(2, 5);
    i.setLocale('de'); ok(el.open); ok(el.matches(':modal')); eq(input.value, 'user state'); eq(document.activeElement, input); eq(input.selectionStart, 2); eq(input.selectionEnd, 5); el.close();
  });
  await test('uncontrolled form state inside a morphed region survives', ({ root, own }) => {
    const el = root(`<section data-i18n-component><div data-i18n-target="form"><label key="l">Name<input key="input"><input key="check" type="checkbox"></label></div><template data-i18n-for="form" data-i18n-locale="en"><label key="l">Name<input key="input"><input key="check" type="checkbox"></label></template><template data-i18n-for="form" data-i18n-locale="de"><label key="l">Name DE<input key="input"><input key="check" type="checkbox"></label></template></section>`);
    const i = own(api.createI18n()); own(api.bind(el, i)); const input = el.querySelector('input'); const check = el.querySelector('[type=checkbox]'); input.value = 'live'; check.checked = true; input.focus(); i.setLocale('de');
    eq(el.querySelector('input'), input); eq(input.value, 'live'); eq(check.checked, true); eq(document.activeElement, input);
  });
  await test('attribute-only localization preserves shell state and empty strings', ({ root, own }) => {
    const el = root(`<button data-i18n-component aria-expanded="true" data-state="open" data-init="" title="Close" data-i18n-title-en="Close" data-i18n-title-de="" aria-label="Close" data-i18n-aria-label-en="Close" data-i18n-aria-label-de="Schließen">×</button>`);
    const i = own(api.createI18n()); own(api.bind(el, i)); i.setLocale('de'); eq(el.title, ''); eq(el.getAttribute('aria-label'), 'Schließen'); eq(el.getAttribute('aria-expanded'), 'true'); eq(el.dataset.state, 'open'); ok(el.hasAttribute('data-init'));
  });
  await test('attribute removal is explicit and reversible', ({ root, own }) => {
    const el = root(`<a data-i18n-component title="English" data-i18n-title-en="English" data-i18n-remove-de="title" href="/en" data-i18n-href-en="/en" data-i18n-href-de="/de">link</a>`);
    const i = own(api.createI18n()); own(api.bind(el, i)); i.setLocale('de'); ok(!el.hasAttribute('title')); eq(el.getAttribute('href'), '/de'); i.setLocale('en'); eq(el.title, 'English');
  });
  await test('conflicting removal and value declarations fail before attribute writes', ({ root, own }) => {
    const el = root(`<div data-i18n-component title="original" data-i18n-title-en="value" data-i18n-remove-en="title"></div>`); const i = own(api.createI18n()); throws(() => api.bind(el, i), /conflicting/); eq(el.title, 'original');
  });
  await test('fallback regions reflect the language actually rendered', ({ root, own }) => {
    const el = root(basic); const i = own(api.createI18n({ locale: 'fr-CA' })); own(api.bind(el, i)); eq(el.lang, 'fr-CA'); eq(el.querySelector('[data-i18n-target]').lang, 'en'); eq(el.querySelector('h2').textContent, 'Welcome');
  });
  await test('RTL and script-region attributes', ({ root, own }) => {
    const el = root(`<button data-i18n-component data-i18n-title-zh-hant-tw="繁體" data-i18n-title-en="English">X</button>`); const i = own(api.createI18n({ locale: 'zh-Hant-TW' })); own(api.bind(el, i)); eq(el.title, '繁體'); i.setLocale('ar'); eq(el.dir, 'rtl');
  });
  await test('literal interpolation cannot inject markup', ({ root, own }) => {
    const el = root(`<section data-i18n-component><p data-i18n-target="text"></p><template data-i18n-for="text" data-i18n-locale="en">Hello <span data-i18n-value="name"></span></template></section>`); const i = own(api.createI18n()); const binding = own(api.bind(el, i, { values: { name: '<img src=x onerror=alert(1)>' } })); eq(el.querySelector('p span').textContent, '<img src=x onerror=alert(1)>'); ok(!el.querySelector('p img')); binding.setValues({ name: 'Aron' }); eq(el.querySelector('p span').textContent, 'Aron');
  });
  await test('missing or nonprimitive interpolation fails explicitly', ({ root, own }) => {
    const el = root(`<section data-i18n-component><span data-i18n-value="name"></span></section>`); const i = own(api.createI18n()); throws(() => api.bind(el, i), /missing interpolation/); throws(() => api.bind(el, i, { values: { name: {} } }), /primitive/);
  });
  await test('interpolation slots cannot erase child elements', ({ root, own }) => {
    const el = root(`<section data-i18n-component><span data-i18n-value="name"><b>child</b></span></section>`); const i = own(api.createI18n()); throws(() => api.bind(el, i, { values: { name: 'value' } }), /text only/);
  });
  await test('plural templates use locale-specific categories and current quantities', ({ root, own }) => {
    const el = root(`<section data-i18n-component><p data-i18n-target="cart" data-i18n-count="count"></p>${['one', 'few', 'many', 'other'].map(category => `<template data-i18n-for="cart" data-i18n-locale="ru" data-i18n-plural="${category}"><span data-i18n-value="count"></span> ${category}</template>`).join('')}</section>`);
    const i = own(api.createI18n({ locale: 'ru', fallback: [] })); const binding = own(api.bind(el, i, { values: { count: 1 } })); eq(el.querySelector('p').textContent, '1 one'); binding.setValues({ count: 2 }); eq(el.querySelector('p').textContent, '2 few'); binding.setValues({ count: 5 }); eq(el.querySelector('p').textContent, '5 many'); binding.setValues({ count: 1.5 }); eq(el.querySelector('p').textContent, '1.5 other');
  });
  await test('plural category falls back to other and rejects nonnumeric count', ({ root, own }) => {
    const el = root(`<section data-i18n-component><p data-i18n-target="n" data-i18n-count="count"></p><template data-i18n-for="n" data-i18n-locale="en" data-i18n-plural="other">items</template></section>`); const i = own(api.createI18n()); const binding = own(api.bind(el, i, { values: { count: 1 } })); eq(el.querySelector('p').textContent, 'items'); throws(() => binding.setValues({ count: '1' }), /finite number/);
  });
  await test('new template content receives its own localized attributes', ({ root, own }) => {
    const el = root(`<section data-i18n-component><p data-i18n-target="text"></p><template data-i18n-for="text" data-i18n-locale="en"><button data-i18n-title-en="Close" data-i18n-title-de="Schließen">X</button></template></section>`); const i = own(api.createI18n()); own(api.bind(el, i)); i.setLocale('de'); eq(el.querySelector('p button').title, 'Schließen');
  });
  await test('nested components own independent regions', ({ root, own }) => {
    const el = root(`<section data-i18n-component><h2 data-i18n-target="heading"></h2><template data-i18n-for="heading" data-i18n-locale="en">Parent</template><template data-i18n-for="heading" data-i18n-locale="de">Eltern</template><section data-i18n-component><button data-i18n-title-en="Child" data-i18n-title-de="Kind" data-state="open">X</button></section></section>`);
    const i = own(api.createI18n()); own(api.bind(el, i)); const child = el.querySelector('section'); const childButton = child.querySelector('button'); own(api.bind(child, i)); i.setLocale('de'); eq(el.querySelector('h2').textContent, 'Eltern'); eq(childButton.title, 'Kind'); eq(childButton.dataset.state, 'open'); eq(child.querySelector('button'), childButton);
  });
  await test('parent regions cannot include child ownership', ({ root, own }) => {
    const el = root(`<section data-i18n-component><div data-i18n-target="body"><section data-i18n-component></section></div><template data-i18n-for="body" data-i18n-locale="en">Parent</template></section>`); const i = own(api.createI18n()); throws(() => api.bind(el, i), /NESTED_OWNERSHIP/);
  });
  await test('overlapping targets and source-inside-target fail validation', ({ root, own }) => {
    const el = root(`<section data-i18n-component><div data-i18n-target="a"><span data-i18n-target="b"></span><template data-i18n-for="a" data-i18n-locale="en">A</template></div><template data-i18n-for="b" data-i18n-locale="en">B</template></section>`); const i = own(api.createI18n()); const codes = api.validateI18n(el).map(issue => issue.code); ok(codes.includes('OVERLAPPING_TARGET')); ok(codes.includes('SOURCE_INSIDE_TARGET')); throws(() => api.bind(el, i), /invalid component/);
  });
  await test('renderers read latest state after async load and explicitly control form properties', async ({ root, own }) => {
    const el = root('<section></section>'); const i = own(api.createI18n()); let state = { name: 'initial', checked: true }; let finish;
    const binding = own(api.bind(el, i, { getState: () => state, render: ({ state, locale }) => `<input key="check" type="checkbox"><p>${state.name}/${locale}</p>`, afterRender: ({ state, root, query }) => query(root.querySelector('input')).prop('checked', state.checked) }));
    eq(el.querySelector('input').checked, true); const pending = i.loadLocale('de', () => new Promise(resolve => { finish = resolve; })); state = { name: 'latest', checked: false }; finish(); await pending; eq(el.querySelector('p').textContent, 'latest/de'); eq(el.querySelector('input').checked, false); eq(binding.context.state, state);
  });
  await test('full renderer guards nested ownership and synchronous return type', ({ root, own }) => {
    const el = root('<section><section data-i18n-component></section></section>'); const i = own(api.createI18n()); throws(() => api.bind(el, i, { render: () => '<p>Hello</p>' }), /nested components/);
    el.innerHTML = ''; throws(() => api.bind(el, i, { render: async () => '<p>Hello</p>' }), /synchronously/); throws(() => api.bind(el, i, { render: () => '<section data-i18n-component></section>' }), /introduce nested/);
  });
  await test('refresh reads changed state; override values remain explicit', ({ root, own }) => {
    const el = root('<section data-i18n-component><span data-i18n-value="value"></span></section>'); const i = own(api.createI18n()); let state = { value: 1 }; const b = own(api.bind(el, i, { getState: () => state, values: state => state })); state = { value: 2 }; b.refresh(); eq(el.querySelector('span').textContent, '2'); b.setValues({ value: 3 }); state = { value: 4 }; b.refresh(); eq(el.querySelector('span').textContent, '3');
  });
  await test('binding disposal unsubscribes and permits rebinding', ({ root, own }) => {
    const el = root(basic); const i = own(api.createI18n()); const b = api.bind(el, i); throws(() => api.bind(el, i), /already bound/); b.dispose(); b.dispose(); i.setLocale('de'); eq(el.querySelector('h2').textContent, 'Welcome'); throws(() => b.refresh(), /disposed/); own(api.bind(el, i)); eq(el.querySelector('h2').textContent, 'Willkommen');
  });
  await test('newly mounted components immediately receive current locale', ({ root, own }) => {
    const el = root(basic); const i = own(api.createI18n()); i.setLocale('de'); own(api.bind(el, i)); eq(el.querySelector('h2').textContent, 'Willkommen');
  });
  await test('mount includes its scope, supports nested roots and disposes as a group', ({ root, own }) => {
    const el = root(`<section data-i18n-component><button data-i18n-title-en="Outer" data-i18n-title-de="Außen"></button><section data-i18n-component><button data-i18n-title-en="Inner" data-i18n-title-de="Innen"></button></section></section>`); const i = own(api.createI18n()); const group = own(api.mount(el, i)); eq(group.bindings.length, 2); i.setLocale('de'); eq(el.querySelector('button').title, 'Außen'); eq(el.querySelector('section').querySelector('button').title, 'Innen'); group.dispose(); i.setLocale('en'); eq(el.querySelector('button').title, 'Außen');
  });
  await test('component completion event fires after its writes; observers see all renderers', ({ root, own }) => {
    const el = root(basic); const i = own(api.createI18n()); own(api.bind(el, i)); let event; el.addEventListener(api.I18N_CHANGE_EVENT, e => { event = e; eq(el.querySelector('h2').textContent, 'Willkommen'); }); let observed;
    i.subscribe(() => { observed = el.querySelector('h2').textContent; }); i.setLocale('de'); eq(event.detail.snapshot.locale, 'de'); eq(event.detail.root, el); eq(observed, 'Willkommen');
  });
  await test('locale reflection can be disabled', ({ root, own }) => {
    const el = root(basic); const i = own(api.createI18n()); own(api.bind(el, i, { reflectLocale: false })); i.setLocale('de'); ok(!el.hasAttribute('lang')); ok(!el.querySelector('[data-i18n-target]').hasAttribute('lang'));
  });
  await test('rescan explicitly adopts modified sources and newly added targets', ({ root, own }) => {
    const el = root(basic); const i = own(api.createI18n()); const b = own(api.bind(el, i)); el.querySelector('[data-i18n-locale="en"]').innerHTML = '<h2 key="heading">Updated</h2>'; b.refresh(); eq(el.querySelector('h2').textContent, 'Welcome'); b.rescan(); eq(el.querySelector('h2').textContent, 'Updated');
  });
  await test('externally replaced target requires rescan', ({ root, own }) => {
    const el = root(basic); const i = own(api.createI18n()); const b = own(api.bind(el, i)); el.querySelector('[data-i18n-target]').replaceWith(Object.assign(document.createElement('div'), { innerHTML: 'new' })); throws(() => b.refresh(), /target was replaced/);
  });
  await test('unsupported locale failure occurs before changing any live region', ({ root, own }) => {
    const el = root(basic); const i = own(api.createI18n({ fallback: [] })); own(api.bind(el, i)); throws(() => i.setLocale('fr'), /subscribers failed/); eq(el.querySelector('h2').textContent, 'Welcome'); eq(i.locale, 'fr');
  });
  await test('validator reports locale coverage, unsupported ARIA state and ID references', ({ root }) => {
    const el = root(`<section data-i18n-component data-i18n-aria-expanded-en="true"><p data-i18n-target="text"></p><template data-i18n-for="text" data-i18n-locale="en"><label for="missing">Name</label><span data-i18n-value="unknown"></span></template></section>`); const codes = api.validateI18n(el, { locales: ['en', 'de'], values: [] }).map(issue => issue.code); for (const code of ['MISSING_LOCALE', 'UNSUPPORTED_ATTRIBUTE', 'MISSING_ID_REFERENCE', 'UNKNOWN_VALUE']) ok(codes.includes(code), code);
  });
  await test('validator catches duplicate targets, variants, keys, IDs, invalid tags and plurals', ({ root }) => {
    const el = root(`<section data-i18n-component><p data-i18n-target="text"></p><p data-i18n-target="text"></p><template data-i18n-for="text" data-i18n-locale="en"><b key="x" id="dup"></b><b key="x" id="dup"></b></template><template data-i18n-for="text" data-i18n-locale="en">X</template><template data-i18n-for="text" data-i18n-locale="de_DE">Y</template><template data-i18n-for="text" data-i18n-locale="de" data-i18n-plural="invalid">Y</template></section>`); const codes = api.validateI18n(el).map(issue => issue.code); for (const code of ['DUPLICATE_TARGET', 'DUPLICATE_VARIANT', 'DUPLICATE_KEY', 'DUPLICATE_ID', 'INVALID_LOCALE', 'INVALID_PLURAL', 'MISSING_COUNT']) ok(codes.includes(code), code);
  });
  await test('validator rejects nested templates and unbound sources', ({ root }) => {
    const el = root(`<section data-i18n-component><template data-i18n-for="missing" data-i18n-locale="en"><template>hidden</template></template></section>`); const codes = api.validateI18n(el).map(issue => issue.code); ok(codes.includes('NESTED_TEMPLATE')); ok(codes.includes('MISSING_TARGET'));
  });
  await test('cross-document binding uses the owning realm', async ({ own }) => {
    const frame = document.createElement('iframe'); fixture.append(frame); const doc = frame.contentDocument; doc.body.innerHTML = basic; const el = doc.body.firstElementChild; const i = own(api.createI18n()); own(api.bind(el, i)); let realmCorrect = false; el.addEventListener(api.I18N_CHANGE_EVENT, event => { realmCorrect = event instanceof frame.contentWindow.CustomEvent; }); i.setLocale('de'); eq(el.querySelector('h2').textContent, 'Willkommen'); ok(realmCorrect);
  });
  await test('an explicit root inside a shadow tree works without piercing boundaries', ({ own }) => {
    const host = document.createElement('div'); fixture.append(host); const shadow = host.attachShadow({ mode: 'open' }); shadow.innerHTML = basic; const el = shadow.firstElementChild; const i = own(api.createI18n()); own(api.bind(el, i)); i.setLocale('de'); eq(el.querySelector('h2').textContent, 'Willkommen');
  });
  await test('binding an invalid root or disposed controller fails', ({ root, own }) => {
    const i = own(api.createI18n()); throws(() => api.bind(null, i), /Element/); i.dispose(); throws(() => api.bind(root('<section></section>'), i), /disposed/);
  });
  await test('runtime injection rejects missing morph capability', () => {
    throws(() => api.createDomI18n(() => ({})), /load defuss-morph/);
  });
  await test('browser reinstallation reuses the namespace; core injection has no global install', async () => {
    if (query.i18n) {
      const first = query.i18n; const module = await import('/dist/all.js?reinstall'); eq(module.installGlobal(query), first); eq(query.i18n, first);
    } else eq(query.i18n, undefined);
  });
  await test('custom direction policy applies to resolved regions', ({ root, own }) => {
    const el = root(basic); const i = own(api.createI18n({ direction: () => 'rtl' })); own(api.bind(el, i)); eq(el.dir, 'rtl'); eq(el.querySelector('[data-i18n-target]').dir, 'rtl');
  });
  await test('controller disposal permits rebinding without stale cleanup deleting the new binding', ({ root, own }) => {
    const el = root(basic); const first = api.createI18n(); const previous = api.bind(el, first); first.dispose(); ok(previous.disposed); const second = own(api.createI18n({ locale: 'de' })); const b = own(api.bind(el, second)); previous.dispose(); throws(() => api.bind(el, second), /already bound/); second.setLocale('en'); eq(el.querySelector('h2').textContent, 'Welcome'); ok(!b.disposed);
  });
  await test('failed value preparation restores the previous explicit value map', ({ root, own }) => {
    const el = root('<section data-i18n-component><span data-i18n-value="name"></span></section>'); const i = own(api.createI18n()); const b = own(api.bind(el, i, { values: { name: 'original' } })); b.setValues({ name: 'explicit' }); throws(() => b.setValues({}), /missing interpolation/); b.refresh(); eq(el.querySelector('span').textContent, 'explicit');
  });
  await test('validation covers attributes and stable identity tags before binding', ({ root }) => {
    const el = root(`<section><button data-i18n-title-en="Close"></button><div data-i18n-target="x"></div><template data-i18n-for="x" data-i18n-locale="en"><h2 key="heading">A</h2></template><template data-i18n-for="x" data-i18n-locale="de"><h3 key="heading">B</h3></template></section>`); const codes = api.validateI18n(el, { locales: ['en', 'de'] }).map(issue => issue.code); ok(codes.includes('MISSING_ATTRIBUTE_LOCALE')); ok(codes.includes('IDENTITY_TAG_MISMATCH'));
  });
  await test('raw-text interpolation slots are rejected before serialization can inject markup', ({ root, own }) => {
    const payload = '</style></script><img src="x" onerror="window.__i18nInjected=true">';
    for (const tag of ['style', 'script']) {
      const el = root(`<section data-i18n-component><div data-i18n-target="t">safe</div><template data-i18n-for="t" data-i18n-locale="en"><${tag} data-i18n-value="v"></${tag}></template></section>`); const i = own(api.createI18n());
      throws(() => api.bind(el, i, { values: { v: payload } }), /raw-text/); eq(el.querySelector('[data-i18n-target]').innerHTML, 'safe'); ok(!el.querySelector('img'));
    }
    const shell = root('<section data-i18n-component><style data-i18n-value="v"></style></section>'); throws(() => api.bind(shell, own(api.createI18n()), { values: { v: payload } }), /raw-text/);
    throws(() => api.bind(root('<section></section>'), own(api.createI18n()), { values: { v: payload }, render: () => '<style data-i18n-value="v"></style>' }), /raw-text/); ok(!window.__i18nInjected);
  });
  await test('async afterRender is rejected instead of emitting early completion', ({ root, own }) => {
    const el = root('<section></section>'); const i = own(api.createI18n()); throws(() => api.bind(el, i, { render: () => '<p>copy</p>', afterRender: async () => {} }), /afterRender must be synchronous/);
  });
  await test('invalid fallback direction is diagnosed before live region writes', ({ root, own }) => {
    const el = root(basic); const i = own(api.createI18n({ locale: 'fr', direction: tag => tag === 'fr' ? 'ltr' : 'invalid' })); throws(() => api.bind(el, i), /direction must be/); eq(el.querySelector('h2').textContent, 'Welcome'); ok(!el.querySelector('[data-i18n-target]').hasAttribute('lang'));
  });
  return results;
}
