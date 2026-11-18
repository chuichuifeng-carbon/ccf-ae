import { matchesCatalogSearch } from '~/utils/catalog-search';

function setupFilters() {
  const chassis = document.querySelector<HTMLSelectElement>('[data-filter-chassis]');
  const category = document.querySelector<HTMLSelectElement>('[data-filter-category]');
  const search = document.querySelector<HTMLInputElement>('[data-filter-search]');
  if (!chassis || !category || !search || chassis.dataset.ready) return;
  chassis.dataset.ready = 'true';
  const cards = [...document.querySelectorAll<HTMLElement>('[data-product-collection] article[data-category]')];
  const status = document.querySelector<HTMLElement>('[data-filter-status]');
  const empty = document.querySelector<HTMLElement>('[data-filter-empty]');
  const scrollKey = 'ccf-bmw-scroll';
  const valid = (select: HTMLSelectElement, value: string) =>
    [...select.options].some((o) => o.value === value) ? value : '';
  const update = (writeUrl = true) => {
    let count = 0;
    for (const card of cards) {
      const match =
        (!chassis.value || (card.dataset.chassis || '').split(' ').includes(chassis.value)) &&
        (!category.value || card.dataset.category === category.value) &&
        matchesCatalogSearch(card.dataset.search || '', search.value);
      card.hidden = !match;
      card.style.display = match ? '' : 'none';
      if (match) count++;
    }
    if (status) status.textContent = `Найдено товаров: ${count}`;
    const summary = document.querySelector('[data-collection-summary]');
    if (summary)
      summary.textContent = `Показано ${count} из ${cards.length} товаров. Откройте карточку для фотографий и запроса цены.`;
    if (empty) empty.hidden = count > 0;
    if (writeUrl) {
      const url = new URL(location.href);
      for (const [key, value] of [
        ['chassis', chassis.value],
        ['category', category.value],
        ['q', search.value.trim()],
      ]) {
        if (value) url.searchParams.set(key, value);
        else url.searchParams.delete(key);
      }
      if (url.hash.startsWith('#bmw-')) url.hash = chassis.value ? `bmw-${chassis.value}` : '';
      history.replaceState(history.state, '', url);
    }
  };
  const readUrl = () => {
    const url = new URL(location.href);
    chassis.value = valid(
      chassis,
      url.searchParams.get('chassis') ?? (url.hash.startsWith('#bmw-') ? url.hash.slice(5) : '')
    );
    category.value = valid(category, url.searchParams.get('category') || '');
    search.value = (url.searchParams.get('q') || '').slice(0, 120);
    update(false);
  };
  const saveScroll = () => {
    try {
      sessionStorage.setItem(scrollKey, JSON.stringify({ url: location.href, y: scrollY }));
    } catch {
      /* Storage is optional. */
    }
  };
  const onUrlChange = () => readUrl();
  chassis.addEventListener('change', () => update());
  category.addEventListener('change', () => update());
  search.addEventListener('input', () => update());
  document.querySelector('[data-filter-reset]')?.addEventListener('click', () => {
    chassis.value = category.value = search.value = '';
    update();
    try {
      sessionStorage.removeItem(scrollKey);
    } catch {
      /* Storage is optional. */
    }
  });
  document.querySelectorAll<HTMLAnchorElement>('a[href^="#bmw-"]').forEach((link) =>
    link.addEventListener('click', (event) => {
      event.preventDefault();
      chassis.value = valid(chassis, link.hash.slice(5));
      category.value = search.value = '';
      update();
      chassis.focus();
    })
  );
  window.addEventListener('hashchange', onUrlChange);
  window.addEventListener('popstate', onUrlChange);
  window.addEventListener('pagehide', saveScroll);
  document.addEventListener(
    'astro:before-swap',
    () => {
      saveScroll();
      window.removeEventListener('hashchange', onUrlChange);
      window.removeEventListener('popstate', onUrlChange);
      window.removeEventListener('pagehide', saveScroll);
    },
    { once: true }
  );
  readUrl();
  try {
    const saved = JSON.parse(sessionStorage.getItem(scrollKey) || 'null');
    if (saved?.url === location.href && Number.isFinite(saved.y) && saved.y >= 0)
      requestAnimationFrame(() => requestAnimationFrame(() => window.scrollTo(0, saved.y)));
  } catch {
    /* Native browser scroll restoration remains available. */
  }
}
document.addEventListener('astro:page-load', setupFilters);
