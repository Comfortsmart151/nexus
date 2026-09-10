import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const file = path.join(root, 'src/data/nexusMasterLibrary.json');
const resources = JSON.parse(fs.readFileSync(file, 'utf8'));

const keyCounts = new Map();
for (const r of resources) {
  const h = r.priceHistory?.at(-1) ?? {};
  const key = `${r.type}|${r.unit}|${Number(r.defaultUnitPrice || 0).toFixed(2)}|${h.mappingConfidence ?? ''}`;
  keyCounts.set(key, (keyCounts.get(key) ?? 0) + 1);
}

const rows = resources.map((r) => {
  const h = r.priceHistory?.at(-1) ?? {};
  const p = Number(r.defaultUnitPrice || 0);
  const key = `${r.type}|${r.unit}|${p.toFixed(2)}|${h.mappingConfidence ?? ''}`;
  const cloneCount = keyCounts.get(key) ?? 1;
  const flags = [];
  if (p <= 0) flags.push('NO_PRICE');
  if (h.mappingConfidence === 'LOW') flags.push('LOW_CONFIDENCE');
  if (cloneCount >= 25 && h.mappingConfidence === 'LOW') flags.push('MASS_CLONED_REFERENCE');
  if ((h.notes ?? '').includes('CO_TYPE_UNIT')) flags.push('TYPE_UNIT_FALLBACK');
  if (r.type === 'equipment' && r.unit === 'hora' && p >= 3000 && /mezcladora|vibrador|taladro|pulidora|sierra|compactador manual/i.test(r.name)) flags.push('SMALL_EQUIPMENT_OUTLIER');
  return { id:r.id, name:r.name, type:r.type, unit:r.unit, price:p, confidence:h.mappingConfidence ?? '', verification:h.verificationStatus ?? '', cloneCount, flags };
});

const summary = {
  total: rows.length,
  withPrice: rows.filter(r => r.price > 0).length,
  lowConfidence: rows.filter(r => r.flags.includes('LOW_CONFIDENCE')).length,
  massCloned: rows.filter(r => r.flags.includes('MASS_CLONED_REFERENCE')).length,
  typeUnitFallback: rows.filter(r => r.flags.includes('TYPE_UNIT_FALLBACK')).length,
  smallEquipmentOutliers: rows.filter(r => r.flags.includes('SMALL_EQUIPMENT_OUTLIER')).length,
};

fs.writeFileSync(path.join(root, 'src/data/nexusPriceAudit.json'), JSON.stringify({generatedAt:new Date().toISOString(), summary, rows}, null, 2));
console.log(summary);
