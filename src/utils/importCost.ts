/** USD amounts are calculated in integer cents, never using floating-point sums. */
export function parseUsd(value: string): number | null {
  const normalized = value
    .trim()
    .replace(/[٠-٩]/g, (digit) => String('٠١٢٣٤٥٦٧٨٩'.indexOf(digit)))
    .replace(/[۰-۹]/g, (digit) => String('۰۱۲۳۴۵۶۷۸۹'.indexOf(digit)))
    .replace('٫', '.');
  if (!/^\d+(?:\.\d{1,2})?$/.test(normalized)) return null;
  const [whole, fraction = ''] = normalized.split('.');
  const cents = Number(whole) * 100 + Number(fraction.padEnd(2, '0'));
  return Number.isSafeInteger(cents) && cents <= 100_000_000_00 ? cents : null;
}

export function calculateImportCost(factory: number, freight: number, other: number, retail: number) {
  if (![factory, freight, other, retail].every((n) => Number.isSafeInteger(n) && n >= 0 && n <= 100_000_000_00)) {
    throw new RangeError('Use non-negative integer cents within the supported range.');
  }
  const landed = factory + freight + other;
  const profit = retail - landed;
  return { landed, profit, margin: retail === 0 ? null : (profit / retail) * 100 };
}
