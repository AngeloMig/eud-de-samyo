"""Read-only workbook extraction and conservative comparison of public retailer feeds.

Run with --fetch to refresh the three public Shopify catalog feeds. Original
workbooks are never modified. A missing comparable remains missing, not zero.
"""
from pathlib import Path
from zipfile import ZipFile
from xml.etree import ElementTree as ET
from concurrent.futures import ThreadPoolExecutor
from functools import lru_cache
import argparse, csv, json, re, unicodedata, urllib.request

ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / 'dev/pricing'
NS = {'s': 'http://schemas.openxmlformats.org/spreadsheetml/2006/main'}
SOURCES = {'psm': 'https://www.perfumestudiomnl.com',
           'perfumes': 'https://www.perfumes.com.ph', 'rack': 'https://perfumerackph.com'}
NAMES = {'psm': 'PerfumeStudioMNL', 'perfumes': 'Perfume Philippines', 'rack': 'Perfume Rack PH'}
DATE = '2026-11-26'

def extract():
    products = []
    for category, label in [('popular', 'Popular'), ('niche', 'Niche')]:
        name = f'SANGYO_{label}_100_Pricing_Profit_FIXED.xlsx'
        with ZipFile(Path('/Users/angelomiguel/SANGYO') / name) as z:
            strings = []
            if 'xl/sharedStrings.xml' in z.namelist():
                strings = [''.join(x.itertext()) for x in ET.fromstring(z.read('xl/sharedStrings.xml')).findall('s:si', NS)]
            for idx, group in [(2, 'Men'), (3, 'Women')]:
                for row in ET.fromstring(z.read(f'xl/worksheets/sheet{idx}.xml')).findall('.//s:row', NS)[1:]:
                    cells = {}
                    for c in row.findall('s:c', NS):
                        v, inline = c.find('s:v', NS), c.find('s:is', NS)
                        value = v.text if v is not None else ''.join(inline.itertext()) if inline is not None else ''
                        if c.get('t') == 's': value = strings[int(value)]
                        cells[re.sub(r'\d', '', c.get('r'))] = value
                    d = cells
                    products.append(dict(id=f'{category}-{group.lower()}-{d["D"]}', category=category,
                        segment=group, rank=int(d['A']), brand=d['B'], name=d['C'], sku=d['D'],
                        variant=d['E'], supplierGender=d['F'], wholesale=float(d['G']), rrp=float(d['H']),
                        sourcePrice=float(d['I']), sourceShipping=float(d['L']), sourceFee=float(d['M']),
                        sourceProfit=float(d['O']), sheet=f'{group} - 50', row=int(row.get('r')), source=name))
    return products

def fetch(pair):
    key, base = pair
    products = []
    for page in range(1, 16):
        req = urllib.request.Request(f'{base}/products.json?limit=250&page={page}', headers={'User-Agent': 'Mozilla/5.0 (price comparison research)'})
        data = json.load(urllib.request.urlopen(req, timeout=30))['products']
        products.extend(data)
        if len(data) < 250: break
    Path(f'/tmp/sangyo-market-{key}.json').write_text(json.dumps({'source': base, 'products': products}))
    return key, len(products)

@lru_cache(maxsize=40000)
def norm(s):
    s = unicodedata.normalize('NFKD', s).encode('ascii', 'ignore').decode().lower()
    return re.sub(r'[^a-z0-9]+', ' ', s).strip()

def concentration(s):
    s = norm(s)
    if re.search(r'\b(extrait|extract|xdp)\b', s): return 'extrait'
    if re.search(r'\b(edp|eau de parfum|eau du parfum)\b', s): return 'edp'
    if re.search(r'\b(edt|eau de toilette)\b', s): return 'edt'
    if 'parfumee' in s: return 'scent-spray'
    if re.search(r'\b(parfum|perfume|pefume)\b', s): return 'parfum'
    if re.search(r'\b(cologne|edc)\b', s): return 'cologne'
    if 'parfumee' in s: return 'scent-spray'
    return None

def sizes(s):
    return [float(v) for v in re.findall(r'(\d+(?:\.\d+)?)\s*ml\b', s, flags=re.I)]

@lru_cache(maxsize=100000)
def identity(s, brand, is_name=False):
    s = norm(s)
    aliases = [norm(brand), norm(brand).replace(' ', '')]
    if brand == 'Initio Parfums Prives': aliases += ['initio parfums', 'initio']
    if brand == 'Thierry Mugler': aliases += ['mugler']
    if brand == 'Mont Blanc': aliases += ['montblanc', 'mont blanc']
    if brand == 'Montale': aliases += ['montale paris']
    if brand == 'Parfums De Marly': aliases += ['parfum de marly']
    if brand == 'Xerjoff': aliases += ['xerjoff casamorati']
    for alias in sorted(aliases, key=len, reverse=True):
        s = re.sub(r'\b'+re.escape(alias)+r'\b', ' ', s)
    s = re.sub(r'\b\d+(?: \d+)?\s*(ml|oz)\b', ' ', s)
    s = re.sub(r'\b(eau de parfum|eau de toilette|eau parfumee|extrait de parfum|extrait de perfume|pure pefume|pure perfume|eau de cologne|eau de intense parfum)\b', ' ', s)
    ignored = 'royal essence|millesime|default title|bottle only|new|for|men|man|women|woman|unisex|male|female|tester|testers|retail|boxed|box|sealed|bnib|with|cap|no'
    if not is_name: ignored += '|edp|edt|edc|parfum|cologne|extrait|xdp|spray|scent'
    s = re.sub(r'\b('+ignored+r')\b', ' ', s)
    return ' '.join(s.split())

def offers():
    result, counts = [], {}
    for key, base in SOURCES.items():
        ps = json.loads(Path(f'/tmp/sangyo-market-{key}.json').read_text())['products']
        counts[key] = len(ps)
        for p in ps:
            for v in p['variants']:
                text = p['title'] + ' ' + v['title']
                # Variant size wins over a product title listing several options.
                ml = sizes(v['title']) or sizes(p['title'])
                if len(set(ml)) != 1: continue
                condition = 'tester' if re.search(r'tester|bottle only|unboxed|no box|partial|decant|refill', text, re.I) else 'retail'
                result.append(dict(store=NAMES[key], title=p['title'], variant=v['title'],
                    ml=ml[0], concentration=concentration(text), condition=condition,
                    price=float(v['price']), available=v.get('available') is True,
                    url=f'{base}/products/{p["handle"]}?variant={v["id"]}', checked=DATE))
    return result, counts

def main():
    global DATE
    parser = argparse.ArgumentParser(); parser.add_argument('--fetch', action='store_true'); parser.add_argument('--date',default=DATE); args = parser.parse_args()
    DATE=args.date
    if args.fetch:
        print(list(ThreadPoolExecutor(3).map(fetch, SOURCES.items())))
        best_request=urllib.request.Request('https://perfumerackph.com/collections/best-sellers/products.json?limit=250',headers={'User-Agent':'Mozilla/5.0 (price comparison research)'})
        with urllib.request.urlopen(best_request,timeout=30) as response:
            Path('/tmp/sangyo-market-bestsellers.json').write_text(json.dumps(json.load(response)))
    shortlists = extract(); short_by_sku = {p['sku']:p for p in shortlists}
    brand_file = Path('/Users/angelomiguel/SANGYO/Shopify -All Fragrances.csv')
    with brand_file.open(encoding='utf-8-sig', newline='') as f:
        brand_lookup = {r['Variant SKU']:r for r in csv.DictReader(f) if r['Variant SKU']}
    products = []
    def amount(value): return float(value.replace(',', '')) if value.strip() else None
    with Path('/Users/angelomiguel/Downloads/Pricelist -All Fragrances.csv').open(encoding='utf-8-sig', newline='') as f:
        for row in csv.DictReader(f):
            sku = row['ItemNumber']; ref = brand_lookup.get(sku, {}); short = short_by_sku.get(sku, {})
            products.append(dict(id=sku, sku=sku, name=row['Name'], brand=ref.get('Vendor') or short.get('brand') or 'Brand not supplied',
                variant=row['Size/Type'], supplierGender=row['Gender'], segment=short.get('segment', row['Gender']),
                category=short.get('category', 'catalog'), rank=short.get('rank'), wholesale=amount(row['Cost (in PHP)']),
                rrp=amount(row['Retail Price (in PHP)']), sourcePrice=short.get('sourcePrice'),
                sourceShipping=short.get('sourceShipping', 1353.99), source='Pricelist -All Fragrances.csv',
                currency='PHP (CSV header)', grams=amount(ref.get('Variant Grams', '')),
                shortlistSource=short.get('source'), shortlistSheet=short.get('sheet'), shortlistRow=short.get('row')))
    present = {p['sku'] for p in products}
    for p in shortlists:
        if p['sku'] not in present: products.append({**p,'id':p['sku'],'currency':'Unverified source units','grams':None})
    candidates, counts = offers(); matched = 0
    best_file=Path('/tmp/sangyo-market-bestsellers.json')
    best_ids={v['id'] for p in json.loads(best_file.read_text())['products'] for v in p['variants']} if best_file.exists() else set()
    for p in products:
        target = identity(p['name'], p['brand'], True); volumes = sizes(p['variant']); ml = volumes[0] if len(volumes)==1 else None; conc = concentration(p['variant'])
        p['ml'] = ml; p['concentration'] = conc
        v=p['variant'].lower()
        p['type'] = 'tester' if 'tester' in v else 'unboxed' if 'unboxed' in v else 'gift set' if 'gift' in v or '+' in v else 'other' if re.search(r'\brefill\b',v) else 'fragrance' if conc else 'other'
        found, review = [], []
        if p['type'] != 'fragrance':
            p['market']=[];p['marketReview']=[];p['marketChecked']=DATE;continue
        for o in candidates:
            title_norm = norm(o['title'])
            brand_tokens = norm(p['brand']).split()
            brand_present = all(x in title_norm for x in brand_tokens) or norm(p['brand']).replace(' ', '') in title_norm.replace(' ', '')
            if p['brand'] == 'Initio Parfums Prives': brand_present = 'initio' in title_norm
            if p['brand'] == 'Thierry Mugler': brand_present = 'mugler' in title_norm
            if not brand_present or identity(o['title'], p['brand']) != target: continue
            opposite = 'women' if p['segment'] == 'Men' else 'men'
            if 'unisex' not in p['variant'].lower() and re.search(r'\b'+opposite+r'\b', title_norm): continue
            if o['ml'] != ml: continue
            if o['concentration'] == conc and o['condition'] == 'retail': found.append(o)
            else: review.append({**o, 'reason': 'Tester/unboxed' if o['condition'] != 'retail' else 'Concentration differs or not specified'})
        p['market'] = sorted(found, key=lambda o: (not o['available'], o['price']))
        p['marketReview'] = sorted(review, key=lambda o: o['price'])[:4]
        p['bestseller'] = any(o['store']=='Perfume Rack PH' and int(o['url'].split('variant=')[1]) in best_ids for o in found)
        p['marketChecked'] = DATE
        if any(o['available'] for o in found): matched += 1
    OUT.mkdir(exist_ok=True)
    (OUT/'bottle-catalog.json').write_text(json.dumps(dict(date=DATE, currencyVerified=False, csvRows=10350, workbookRows=200,
        currencyNote='The new CSV labels cost and retail PHP; supplier quote/stock are unconfirmed. Nine workbook-only SKUs retain unverified source units. No source figures are live supplier quotes.',
        sources=[dict(name=NAMES[k],url=v,catalogProducts=counts[k]) for k,v in SOURCES.items()],
        method='Lowest available exact-name, size and concentration retail offer among three checked PH catalogs. Excludes testers, unboxed and unspecified concentrations. Retailer authenticity, delivery charges and supply are not independently verified. Not a claim of the lowest price anywhere.', products=products), ensure_ascii=False, separators=(',', ':')))
    print(f'{len(products)} catalog rows; {matched} with an available exact comparable; {sum(bool(p["marketReview"]) for p in products)} with review-only offers; {sum(p.get("bestseller",False) for p in products)} retailer bestseller variants')
    for p in products:
        if p['market']: print(p['id'],p['brand'],p['name'],p['variant'],'=>',[(o['store'],o['price'],o['available'],o['title'],o['variant']) for o in p['market']])

if __name__ == '__main__': main()
