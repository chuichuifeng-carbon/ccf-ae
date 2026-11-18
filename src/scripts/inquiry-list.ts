import { productReference } from '~/utils/product-reference';

interface Item {
  slug: string;
  title: string;
  quantity: number;
}
const key = 'ccf-rfq-v1';
let items: Item[] = [];
try {
  const saved: unknown = JSON.parse(sessionStorage.getItem(key) || '[]');
  if (Array.isArray(saved))
    items = saved
      .filter(
        (x): x is Item =>
          x &&
          typeof x.slug === 'string' &&
          /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(x.slug) &&
          typeof x.title === 'string' &&
          x.title.length <= 300 &&
          Number.isInteger(x.quantity) &&
          x.quantity >= 1 &&
          x.quantity <= 9999
      )
      .slice(0, 100);
  items = [...new Map(items.map((item) => [item.slug, item])).values()];
} catch {
  /* An empty in-memory list works when storage is unavailable. */
}
const save = () => {
  try {
    sessionStorage.setItem(key, JSON.stringify(items));
  } catch {
    /* Storage is optional. */
  }
};

function initialize() {
  const root = document.querySelector<HTMLElement>('[data-rfq-widget]');
  if (!root || root.dataset.ready) return;
  root.dataset.ready = 'true';
  const origin = root.dataset.rfqOrigin!;
  const dialog = root.querySelector<HTMLDialogElement>('dialog')!;
  const list = root.querySelector<HTMLUListElement>('[data-rfq-items]')!;
  const template = root.querySelector<HTMLTemplateElement>('template')!;
  const destination = root.querySelector<HTMLInputElement>('[data-rfq-destination]')!;
  const notes = root.querySelector<HTMLTextAreaElement>('[data-rfq-notes]')!;
  const preview = root.querySelector<HTMLTextAreaElement>('[data-rfq-preview]')!;
  const status = root.querySelector<HTMLElement>('[data-rfq-status]')!;
  const whatsapp = root.querySelector<HTMLAnchorElement>('[data-rfq-whatsapp]')!;
  const email = root.querySelector<HTMLAnchorElement>('[data-rfq-email]')!;
  const openButtons = [...document.querySelectorAll<HTMLButtonElement>('[data-rfq-open]')];
  const reference = (item: Item) => `${origin}/products/${item.slug}/`;
  const updateDraft = () => {
    const invalid = !!list.querySelector('[aria-invalid="true"]');
    const message = [
      'Здравствуйте CCF! Прошу оптовое предложение по следующим позициям:',
      ...items.map(
        (item, i) =>
          `${i + 1}. ${item.title}\nКод сайта: ${productReference(item.slug)} · ${item.quantity} ед.\n${reference(item)}`
      ),
      destination.value.trim() ? `Доставка: ${destination.value.trim()}` : '',
      notes.value.trim() ? `Примечания: ${notes.value.trim()}` : '',
      'Прошу указать исполнение, состав поставки, цену в USD, упаковку и перевозку.',
    ]
      .filter(Boolean)
      .join('\n\n');
    preview.value = message;
    const large = encodeURIComponent(message).length > 7000;
    root.querySelector<HTMLElement>('[data-rfq-large]')!.hidden = !large;
    whatsapp.href = large
      ? 'https://wa.me/8613427690360'
      : `https://wa.me/8613427690360?text=${encodeURIComponent(message)}`;
    email.href = `mailto:info@ccfrp.com?subject=${encodeURIComponent('Оптовый запрос CCF')}${large ? '' : '&body=' + encodeURIComponent(message)}`;
    for (const link of [whatsapp, email]) {
      link.setAttribute('aria-disabled', String(invalid));
      link.tabIndex = invalid ? -1 : 0;
    }
    if (invalid) status.textContent = 'Укажите целое количество от 1 до 9999 для каждой позиции.';
  };
  const updateButtons = () => {
    document.querySelectorAll('[data-rfq-count]').forEach((node) => (node.textContent = String(items.length)));
    document.dispatchEvent(new Event('ccf:rfq-change'));
    document.querySelectorAll<HTMLButtonElement>('[data-rfq-add]').forEach((button) => {
      button.hidden = false;
      const added = items.some((item) => item.slug === button.dataset.rfqAdd);
      button.textContent = added ? 'В списке запроса ✓' : 'В список запроса';
      button.setAttribute('aria-pressed', String(added));
    });
  };
  const render = () => {
    list.replaceChildren();
    root.querySelector<HTMLElement>('[data-rfq-empty]')!.hidden = items.length > 0;
    root.querySelector<HTMLElement>('[data-rfq-fields]')!.hidden = items.length === 0;
    items.forEach((item) => {
      const row = template.content.firstElementChild!.cloneNode(true) as HTMLLIElement;
      const link = row.querySelector<HTMLAnchorElement>('[data-rfq-item-link]')!;
      link.textContent = `${item.title} · ${productReference(item.slug)}`;
      link.href = reference(item).replace(origin, '');
      const quantity = row.querySelector<HTMLInputElement>('input')!;
      quantity.value = String(item.quantity);
      quantity.setAttribute('aria-label', `Количество — ${item.title}`);
      quantity.addEventListener('input', () => {
        const value = Number(quantity.value);
        const valid = quantity.value.trim() !== '' && Number.isInteger(value) && value >= 1 && value <= 9999;
        quantity.setAttribute('aria-invalid', String(!valid));
        status.textContent = '';
        if (valid) {
          item.quantity = value;
          save();
        }
        updateDraft();
      });
      row.querySelector('button')!.addEventListener('click', () => {
        items = items.filter((x) => x.slug !== item.slug);
        save();
        status.textContent = 'Позиция убрана.';
        render();
      });
      list.append(row);
    });
    updateButtons();
    updateDraft();
  };
  document.querySelectorAll<HTMLButtonElement>('[data-rfq-add]').forEach((button) =>
    button.addEventListener('click', () => {
      const slug = button.dataset.rfqAdd!,
        title = button.dataset.rfqTitle!;
      if (!items.some((item) => item.slug === slug)) {
        if (items.length >= 100) {
          status.textContent = 'В списке уже 100 позиций. Отправьте этот список перед новым.';
          dialog.showModal();
          return;
        }
        items.push({ slug, title, quantity: 1 });
        save();
      }
      status.textContent = 'Позиция добавлена. Добавьте другие детали или откройте список запроса.';
      render();
    })
  );
  openButtons.forEach((open) => {
    open.hidden = false;
    open.addEventListener('click', () => {
      render();
      dialog.showModal();
    });
  });
  root.querySelector('[data-rfq-close]')!.addEventListener('click', () => dialog.close());
  root.querySelector('[data-rfq-clear]')!.addEventListener('click', () => {
    items = [];
    save();
    status.textContent = 'Список очищен.';
    render();
  });
  root.querySelector('[data-rfq-copy]')!.addEventListener('click', async () => {
    if (list.querySelector('[aria-invalid="true"]')) {
      updateDraft();
      return;
    }
    try {
      await navigator.clipboard.writeText(preview.value);
      status.textContent = 'Текст скопирован.';
    } catch {
      preview.focus();
      preview.select();
      status.textContent = 'Выделенный текст можно скопировать вручную.';
    }
  });
  for (const link of [whatsapp, email])
    link.addEventListener('click', (event) => {
      if (link.getAttribute('aria-disabled') === 'true') {
        event.preventDefault();
        updateDraft();
      }
    });
  destination.addEventListener('input', updateDraft);
  notes.addEventListener('input', updateDraft);
  render();
}
document.addEventListener('astro:page-load', initialize);
