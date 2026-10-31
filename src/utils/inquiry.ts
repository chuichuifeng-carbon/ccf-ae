export function whatsappUrl(context = '', reference = ''): string {
  const message = [
    'مرحباً، أود الاستفسار عن توريد قطع ألياف الكربون من CCF.',
    context ? `المنتج / الموضوع: ${context}` : '',
    reference ? `المرجع: ${reference}` : '',
    'الشركة / نوع النشاط: ',
    'المركبة وسنة الصنع: ',
    'الكمية: ',
    'بلد ومدينة التسليم: ',
  ]
    .filter(Boolean)
    .join('\n');
  return `https://wa.me/8613427690360?text=${encodeURIComponent(message)}`;
}

/** Preserve existing attribution and fragments; only decorate the official RFQ endpoint. */
export function inquiryUrl(href: string | undefined, context: string): string | undefined {
  if (!href) return href;
  let url: URL;
  try {
    url = new URL(href);
  } catch {
    return href;
  }
  if (url.hostname !== 'ccfrp.com' || url.pathname.replace(/\/$/, '') !== '/contact') return href;
  const defaults = { utm_source: 'arabic_site', utm_medium: 'referral', utm_campaign: 'b2b_ar', utm_content: context };
  for (const [key, value] of Object.entries(defaults)) if (!url.searchParams.has(key)) url.searchParams.set(key, value);
  return url.toString();
}
