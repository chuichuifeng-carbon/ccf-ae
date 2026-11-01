import assert from 'node:assert/strict';
import fs from 'node:fs';
import { calculateImportCost, parseUsd } from '../src/utils/importCost.ts';
assert.deepEqual(calculateImportCost(25000, 8500, 11000, 59900), {
  landed: 44500,
  profit: 15400,
  margin: (15400 / 59900) * 100,
});
assert.deepEqual(calculateImportCost(10, 20, 0, 40), { landed: 30, profit: 10, margin: 25 });
assert.equal(calculateImportCost(100, 0, 0, 50).margin, -100);
assert.equal(calculateImportCost(100, 0, 0, 0).margin, null);
assert.equal(calculateImportCost(0, 0, 0, 0).profit, 0);
for (const input of ['', ' ', '-1', 'NaN', 'Infinity', '1e3', '250x', '1,000', '0.001', '100000001'])
  assert.equal(parseUsd(input), null, input);
for (const input of ['250.50', '٢٥٠٫٥٠', '۲۵۰.۵۰']) assert.equal(parseUsd(input), 25050);
assert.equal(parseUsd('100000000'), 10000000000);
assert.throws(() => calculateImportCost(-1, 0, 0, 0), RangeError);
const html = fs.readFileSync('dist/import-cost-calculator/index.html', 'utf8');
assert.equal((html.match(/data-cost-field=/g) || []).length, 4);
assert.ok(!html.includes('<form'));
assert.ok(html.includes('aria-live="polite"'));
assert.ok(html.includes('inputmode="decimal"'));
assert.ok(html.includes('https://wa.me/8613427690360'));
console.log(
  'Passed calculator: example, integer-cent precision, loss, zero revenue, Arabic/Persian digits, invalid/large input, static accessibility and no form.'
);
