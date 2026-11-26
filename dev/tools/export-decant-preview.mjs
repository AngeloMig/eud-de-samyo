// Local only. Reuse the calculator's pure calculation functions to generate
// preview prices, CSVs and a dated forecast; no Shopify connection or writes.
// node dev/tools/export-decant-preview.mjs
import { readFileSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { join, dirname } from 'node:path';
import vm from 'node:vm';

const root = join(dirname(fileURLToPath(import.meta.url)), '../..');
const require = createRequire(import.meta.url);
const read = path => readFileSync(join(root, path), 'utf8');
const settings = JSON.parse(read('dev/pricing/decant-preview-settings.json'));
const script = [...read('dev/decant-pricing.html').matchAll(/<script>([\s\S]*?)<\/script>/g)].at(-1)[1];
const part = (start, end) => {
  const a = script.indexOf(start), b = script.indexOf(end, a + start.length);
  if (a < 0 || b < 0) throw new Error(`Calculator extraction boundary missing: ${start}`);
  return script.slice(a, b);
};
const context = vm.createContext({ SamyoShipping: require(join(root, 'assets/perfume-shipping.js')), settings });
vm.runInContext(
  script.slice(0, script.indexOf('const $=')) +
  part('// [id, label, default', 'let saved={}') + `
  const inputs={}; const $=id=>inputs[id]||(inputs[id]={value:''});
  let saved={previewRec:settings.pricesUsed==='recommended'}; let useTester=settings.cheaperTesters;
  ACTIVE_IDS=settings.rotation==='proposed'?PROPOSED_IDS.slice():Object.keys(LIVE);
  DECANTS=PERFUMES.filter(p=>ACTIVE_IDS.includes(p[0]));
  for(const c of [...COSTS,...IMPORT,...TARGETS,...PLAN,...FIXED])$(c[0]).value=c[2]==null?'':String(c[2]);
  for(const c of SHIPPING)$('delivery_'+c[0]).value=String(c[2]);
  for(const [id,value] of Object.entries(settings.inputs))$(id).value=value==null?'':String(value);
  $('delivery_zone').value=settings.zone;
  ` + part('const usesTester=', 'function renderShipping') +
  part('function combos(', 'let REC=') +
  part('function setStats(', '// Graduated income tax') +
  part('function monthlyScentUsage(', 'function renderBottleLife(') + `
  this.api={DECANTS,LIVE,SOLO,WHOLESALE,SHOP,SETS,SIZES,SI,MIX,S,priced,solveSize,setStats,landed,bottle,fixedStatus,liveSettings,discOf,order,bottleEcon,combos,monthlyScentUsage};
  `, context
);
const a = context.api, s = a.S(), list = a.priced(s), prices = {}, bands = [];
for (const ml of a.SIZES) {
  const solved = a.solveSize(ml, list, s);
  if (!solved.fits && settings.pricesUsed==='recommended') throw new Error(`${ml}ml recommendations cannot meet the requested band.`);
  bands.push({ ml, min: solved.lo, max: solved.hi });
  list.forEach((x, i) => (prices[x.p[0]] ??= [])[a.SI[ml]] = solved.prices[i]);
}
const round = n => Math.round((n + Number.EPSILON) * 100) / 100;
const recommended=JSON.parse(JSON.stringify(prices));
if(settings.pricesUsed!=='recommended')for(const x of list)if(a.LIVE[x.p[0]])prices[x.p[0]]=Array.from(a.LIVE[x.p[0]]);
const model=settings.pricesUsed==='recommended'?s:a.liveSettings(s);
let sales = 0, contribution = 0, waste = 0, pouredMl = 0;
const setMix = a.MIX.map(([id, def]) => {
  const set = a.SETS.find(x => x[0] === id), share = settings.inputs['mix_' + id] ?? def;
  const stats = a.setStats(set, list, (id, ml) => prices[id][a.SI[ml]], model, settings.scents==='cheap'?'cheap':'avg');
  const orders = s.orders * share / 100;
  sales += orders * stats.price; contribution += orders * stats.contrib; waste += orders * stats.waste;
  pouredMl += orders * set[2] * set[3];
  return { id, count: set[2], ml: set[3], discount: a.discOf(set,model) * 100,
    share, orders, averagePrice: round(stats.price), contributionPerOrder: round(stats.contrib) };
});
if (Math.abs(setMix.reduce((n, x) => n + x.share, 0) - 100) > 1e-6) throw new Error('Set mix must total 100%.');
const fixed = a.fixedStatus(), fixedCost = fixed.perMonth;
const images = { sauvage: 'samyo-dior-sauvage-edp.webp', homme: 'samyo-dior-homme-intense.webp',
  terre: 'samyo-brand-hermes-1.webp', roma: 'samyo-brand-valentino-2.webp', eros: 'samyo-brand-versace-1.webp',
  one: 'samyo-dg-the-one.webp', dylan: 'samyo-brand-versace-3.webp',oud:'samyo-brand-tom-ford-3.webp',
  swy: 'samyo-armani-stronger-with-you-intensely.webp' };
const products = a.DECANTS.map(p => ({ id: p[0], title: a.SHOP[p[0]]?.[1] ?? p[2], vendor: p[1],
  handle: a.SHOP[p[0]]?.[0] ?? `preview-${p[0]}`, image: images[p[0]] ?? null,
  prices: prices[p[0]], recommendedPrices:recommended[p[0]], livePrices:a.SOLO[p[0]]??null, soloPrices:a.SOLO[p[0]]??null, bottleMl: p[4], wholesale: a.bottle(p),
  landed: round(a.landed(p, s)), proposedAddition: !a.SHOP[p[0]] }));
const result = { generatedOn: settings.checkedOn, localPreviewOnly: true, settings,
  source: 'dev/decant-pricing.html; AllFragrancesExcelList.xls Cost (PHP), 2026-11-23',
  liveSource: 'dev/pricing/live-prices-2026-11-25.json', pricesUsed: settings.pricesUsed,
  recommendedMarginBand: [s.tlo, s.thi], verifiedBands: bands, products, setMix,
  forecast: { orders: s.orders, averageOrder: round(sales / s.orders), sales: round(sales),
    contribution: round(contribution), margin: contribution / sales, leftoverWaste: round(waste),
    netContribution: round(contribution-waste), fullyCostedMargin: (contribution-waste)/sales,
    ads: s.ads, fixedCost, missingFixedCosts: fixed.missing,
    operatingBeforeTax: round(contribution - waste - s.ads - fixedCost), pouredMl,
    bottlesPerScent: Object.fromEntries(list.map(x=>[x.p[0],Math.ceil(pouredMl/list.length/(x.p[4]*(1-s.loss)))])),
    margin45: round(sales * 0.45 - s.ads - fixedCost),
    margin50: round(sales * 0.50 - s.ads - fixedCost),
    adSensitivity: [...new Set([s.ads, 30000, 75000, 150000])].sort((a, b) => a - b).map(ads =>
      ({ ads, perOrder: round(ads / s.orders), operatingBeforeTax: round(contribution - waste - ads - fixedCost) })) } };
writeFileSync(join(root, 'dev/pricing/decant-preview.json'), JSON.stringify(result, null, 2) + '\n');
const quote = v => /[",\n]/.test(String(v)) ? '"' + String(v).replace(/"/g, '""') + '"' : String(v);
for (const [mode, file] of [['recommended', 'samyo-decant-prices-recommended.csv'], ['current', 'samyo-decant-prices-current.csv']]) {
  const rows = [['Handle', 'Title', 'Option1 Name', 'Option1 Value', 'Variant Price']];
  for (const p of products.filter(p => !p.proposedAddition)) {
    const values = mode === 'recommended' ? p.recommendedPrices.map((n,i)=>i<2?Math.ceil(n*1.35/5)*5:n) : p.livePrices;
    a.SIZES.forEach((ml, i) => rows.push([p.handle, i ? '' : p.title, i ? '' : 'Size', `${ml} ml`, values[i].toFixed(2)]));
  }
  writeFileSync(join(root, 'dev/pricing', file), '\uFEFF' + rows.map(r => r.map(quote).join(',')).join('\n') + '\n');
}
console.log(JSON.stringify(result.forecast, null, 2));
export { a, s, list, prices, model, result };
