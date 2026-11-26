import {DEFAULTS,value,round,lowest,costs,price,weight,order,targetPrice,route,monthly,affiliate} from './bottle-math.mjs';
const $=id=>document.getElementById(id),esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const money=v=>Number.isFinite(v)?new Intl.NumberFormat('en-PH',{style:'currency',currency:'PHP',minimumFractionDigits:2}).format(Math.abs(v)<.005?0:v):'Not available';
const pct=v=>Number.isFinite(v)?`${(v*100).toFixed(1)}%`:'Not available';
const safeURL=v=>{try{const u=new URL(v);return ['http:','https:'].includes(u.protocol)?u.href:'';}catch{return '';}};
const KEY='sangyo-bottle-pricing-v1',SIZE=50;
let data,products=[],byId=new Map(),results=[],filtered=[],page=1,state,storageAvailable=true,quote=null;
const FILTERS={category:'all',search:'',route:'all',sort:'name',brand:'all',gender:'all',type:'all',evidence:'all',benchmark:'all',profitMin:'',profitMax:'',marginMin:'',sizeMin:'',sizeMax:'',supplierSavingMin:'',pageSize:SIZE};
const fresh=()=>({version:1,settings:{...DEFAULTS},overrides:{},filters:{...FILTERS},selected:'547293',basket:[{id:'547293',qty:1}],orderQuote:null});
const groups=[
 ['Dropship delivery',[
  ['shippingBase','Actual shipping: base parcel ₱',1353.99,0,1e7,'Old workbook estimate, not a live quote.'],
  ['customerMin','Minimum customer shipping charge ₱',750,0,1e7,'Capped at actual shipping so delivery is not treated as extra profit.'],
  ['customerShare','Customer share of higher shipping %',50,0,100,'Customer pays the larger of this share or the minimum, up to actual shipping.'],
  ['baseKg','Weight included in base quote kg',1,.01,10000,'Illustrative allowance. Replace with supplier terms.'],
  ['stepKg','Additional weight step kg',.5,.01,10000,'Illustrative step, not a carrier tariff.'],
  ['extraShipping','Actual charge per additional step ₱',350,0,1e7,'Example only. A supplier quote overrides the weight formula.'],
  ['packingKg','Outer packaging weight kg',.2,0,10000,'Added once per order, not to each bottle.'],
  ['fallbackKg','Fallback item weight kg',.5,0,10000,'Used only where the supplied reference has no weight.'],
  ['freeThreshold','Optional free-shipping threshold ₱',10000,0,1e9,'Applies to the item total after all discounts, only when enabled.']]],
 ['Supplier costs & currency',[
  ['fx','PHP per source price unit',1,.000001,10000,'CSV headers say PHP, so 1 is the default. Check the nine workbook-only rows separately.'],
  ['supplierDiscount','Extra supplier promotion %',0,0,100,'A real extra discount off the supplied cost. Catalog RRP saving is not a promotion.'],
  ['importReserve','Import / landed-cost reserve %',0,0,1000,'Of the discounted supplier purchase cost; enter only costs you actually bear.'],
  ['inboundPerBottle','Other acquisition cost per item ₱',0,0,1e7,'Zero for direct dropshipping unless a separate acquisition charge applies. Do not add the same delivery twice.']]],
 ['Selling price & routing',[
  ['retailDiscount','Discount from source RRP %',10,0,100,'Fallback scenario when no comparable price exists. Not a verified market price.'],
  ['undercut','Reduction from lowest checked item price %',0,0,100,'0 matches the observed item price; competitor delivery may be extra.'],
  ['promo','Extra customer promotion %',0,0,100,'Applied once to the chosen item price. Target price solves back to the list price.'],
  ['minMargin','Minimum direct operating margin %',45,0,99,'After delivery, fees, reserves, allocated ads and monthly costs.'],
  ['minProfit','Minimum direct profit per order ₱',500,0,1e9,'Below either profit rule becomes an affiliate candidate.']]],
 ['Fees, protection & other costs',[
  ['gateway','Payment gateway fee %',3.5,0,100,'Estimate charged on item revenue plus customer shipping.'],
  ['shopify','Shopify third-party payment fee %',2,0,100,'Basic reference; edit for the payment methods actually used.'],
  ['paymentFixed','Fixed payment fee per order ₱',15,0,1e7,'One fee per order, including orders with several bottles.'],
  ['reserve','Refund / loss reserve %',2,0,100,'Of item revenue after discounts; a planning reserve, not historical loss.'],
  ['protection','Item protection reserve %',.5,0,100,'Of item revenue. Replace with the actual protection charge if known.'],
  ['packing','Extra packaging per order ₱',0,0,1e7,'Only if you bear packaging beyond supplier shipping.'],
  ['handling','Your handling / labour per order ₱',0,0,1e7,'Owner labour defaults to zero as requested previously.'],
  ['taxReserve','Additional sales-tax reserve %',0,0,100,'Optional scenario allowance, not a legal tax calculation.']]],
 ['Monthly operating plan',[
  ['monthlyOrders','Direct orders per month',100,0,1e7,'Complete orders repeating the current basket. This is an assumption, not an ads forecast.'],
  ['ads','Direct-sales ad budget per month ₱',6000,0,1e9,'Deducted once monthly. Allocation per order is only for comparing products.'],
  ['plan','Shopify Basic per month ₱',1550,0,1e9,'Regular monthly billing reference. Adjust for actual invoice and taxes.'],
  ['apps','Apps per month ₱',0,0,1e9,'Planning input; confirm your actual subscription costs.'],
  ['otherFixed','Other direct-sales fixed costs ₱/month',0,0,1e9,'Exclude the ad budget and Shopify fee already entered.']]]
];
const AFF=[['affiliateRate','Approved commission %',0,0,100],['affiliateClicks','Outbound affiliate clicks/month',0,0,1e9],['affiliateConversion','Affiliate conversion %',0,0,100],['affiliateAov','Merchant item order value ₱',0,0,1e9],['affiliateReversal','Commission reversals %',0,0,100],['affiliateAds','Affiliate ad spend/month ₱',0,0,1e9],['affiliateFixed','Affiliate-specific costs/month ₱',0,0,1e9]];
const numericMeta=[...groups.flatMap(g=>g[1]),...AFF];
const ideas=[
 ['Full catalog, two shortlists','All 10,350 CSV items plus nine workbook-only SKUs, with Popular 100 and Niche 100 views.'],
 ['Flexible filters','Brand, gender, condition, size, supplier RRP saving, profit, margin, recommendation and missing data.'],
 ['Exact variant comparisons','Keep bottle size, concentration and condition separate; no 30ml or tester price against a 100ml retail bottle.'],
 ['Lowest checked in-stock price','Compare the minimum eligible offer from the checked retailers; missing prices remain unavailable.'],
 ['Dated research and evidence','See every matched offer, unavailable listing, excluded comparison and source link.'],
 ['Popularity with a source','Filter retailer bestseller evidence, workbook shortlist or your own recorded monthly orders and assessment.'],
 ['Real supplier promotions','Enter an additional confirmed supplier discount, globally or by SKU, without confusing RRP saving with a promotion.'],
 ['Direct or affiliate routing','Automatically flag loss-making and low-margin direct sales for affiliate review; links are entered separately.'],
 ['Separate shipping amounts','Show actual supplier delivery, what the customer pays and your subsidy in separate rows.'],
 ['Minimum and shared delivery','Use a ₱750 customer minimum with an adjustable share of more expensive shipping.'],
 ['Weight and quote overrides','Estimate larger parcels, edit item weights or replace the estimate with a supplier total quote.'],
 ['One delivery per order','A multi-item basket pays one consolidated parcel estimate instead of one shipping bill per bottle.'],
 ['Fully costed profit','Separate supplier costs, fees on shipping, Shopify, item protection, loss reserves and operating overhead.'],
 ['Discount-aware prices','Extra customer promotion applies once and reduces the actual paid price.'],
 ['45% and 50% price targets','Solve for operating margin, then show the conflict when a matched market price is lower.'],
 ['Monthly order scenarios','Forecast revenue and profit for the current basket at your own volume and ad budget.'],
 ['Break-even and ad allowance','See orders needed to cover monthly spending and the maximum ad cost per order before loss.'],
 ['Cost-increase scenarios','Test supplier/FX +10%, freight +25%, and both together while holding selling prices fixed.'],
 ['Independent affiliate forecast','Clicks × conversion × merchant order value × approved commission, after reversals and affiliate costs.'],
 ['Save, back up and export','Persist inputs by SKU across reloads; back up/restore JSON and export all filtered result rows to CSV.']
];
function field(key,label,val,min,max,hint='',prefix='s-') {return `<label class="field">${esc(label)}<input id="${prefix}${key}" data-setting="${key}" type="number" min="${min}" max="${max}" step="any" value="${val??''}">${hint?`<small>${esc(hint)}</small>`:''}</label>`;}
function selectField(id,label,options,selected){return `<label class="field">${esc(label)}<select id="${id}">${options.map(([v,t])=>`<option value="${esc(v)}" ${String(v)===String(selected)?'selected':''}>${esc(t)}</option>`).join('')}</select></label>`;}
function normalizeSettings(raw={}){
  const s={...DEFAULTS};for(const [key,,def,min,max] of numericMeta){const n=Number(raw[key]);if(raw[key]!==null&&raw[key]!==''&&Number.isFinite(n)&&n>=min&&n<=max)s[key]=n;else s[key]=def;}
  for(const k of ['freeShipping','requirePromotion','confirmedCosts'])s[k]=raw[k]===true;
  s.priceMode=['market','source'].includes(raw.priceMode)?raw.priceMode:'market';
  return s;
}
function normalizeState(raw){
  if(!raw||raw.version!==1||!raw.settings||typeof raw.overrides!=='object')throw Error('This is not a Sangyó bottle-calculator backup.');
  const n=fresh();n.settings=normalizeSettings(raw.settings);
  n.filters={...FILTERS};
  for(const k of Object.keys(FILTERS))if(typeof raw.filters?.[k]==='string'||typeof raw.filters?.[k]==='number')n.filters[k]=String(raw.filters[k]).slice(0,300);
  if(!['all','popular','niche'].includes(n.filters.category))n.filters.category='all';
  n.filters.pageSize=[25,50,100].includes(Number(n.filters.pageSize))?Number(n.filters.pageSize):50;
  n.selected=byId.has(String(raw.selected))?String(raw.selected):n.selected;
  n.basket=Array.isArray(raw.basket)?raw.basket.filter(l=>byId.has(String(l.id))&&Number.isInteger(l.qty)&&l.qty>0&&l.qty<=10000).slice(0,200).map(l=>({id:String(l.id),qty:l.qty})):n.basket;
  for(const [id,o] of Object.entries(raw.overrides)){if(!byId.has(id)||!o||typeof o!=='object')continue;const clean={};
    for(const k of ['cost','price','kg','discount','ownOrders'])if(o[k]!==null&&o[k]!==''&&Number.isFinite(Number(o[k]))&&Number(o[k])>=0&&Number(o[k])<1e10&&(k!=='discount'||Number(o[k])<=100))clean[k]=Number(o[k]);
    if(['unknown','confirmed','unavailable'].includes(o.stock))clean.stock=o.stock;
    if(['unknown','low','medium','high'].includes(o.popularity))clean.popularity=o.popularity;
    if(safeURL(o.affiliateUrl))clean.affiliateUrl=safeURL(o.affiliateUrl);
    if(typeof o.note==='string')clean.note=o.note.slice(0,1000);
    n.overrides[id]=clean;
  }
  n.orderQuote=raw.orderQuote!==null&&raw.orderQuote!==''&&Number.isFinite(Number(raw.orderQuote))&&Number(raw.orderQuote)>=0?Number(raw.orderQuote):null;
  return n;
}
function save(){try{localStorage.setItem(KEY,JSON.stringify(state));$('saved').textContent='Saved in this browser';storageAvailable=true;}catch{$('saved').textContent='Browser storage unavailable—use Back up inputs to keep changes.';storageAvailable=false;}}
function settingsUI(){
  $('settings').innerHTML=groups.map(([label,fields],idx)=>`<details class="group" ${idx===0?'open':''}><summary>${label}</summary><div class="fields">${fields.map(([k,l,,min,max,h])=>field(k,l,state.settings[k],min,max,h)).join('')}</div>${idx===0?`<div class="fields"><label class="check"><input id="s-freeShipping" type="checkbox" ${state.settings.freeShipping?'checked':''}>Apply free shipping above the threshold</label></div>`:idx===1?`<div class="fields"><label class="check"><input id="s-confirmedCosts" type="checkbox" ${state.settings.confirmedCosts?'checked':''}>I have checked supplier quotes and operating costs</label></div>`:idx===2?`<div class="fields">${selectField('s-priceMode','Default item-price basis',[['market','Matched market price; RRP fallback'],['source','Source RRP less the entered discount']],state.settings.priceMode)}<label class="check"><input id="s-requirePromotion" type="checkbox" ${state.settings.requirePromotion?'checked':''}>Require an extra supplier promotion for direct sales</label></div>`:''}</details>`).join('');
  $('affiliate-fields').innerHTML=AFF.map(([k,l,,min,max])=>field(k,l,state.settings[k],min,max)).join('');
  $('idea-list').innerHTML=ideas.map(([h,t])=>`<li><strong>${h}</strong><span>${t}</span></li>`).join('');
  document.querySelectorAll('[data-setting]').forEach(input=>input.addEventListener('input',()=>{
    if(input.value===''||!input.checkValidity()){input.setAttribute('aria-invalid','true');$('saved').textContent='Enter a valid value to update the estimate.';return;}
    input.removeAttribute('aria-invalid');state.settings[input.dataset.setting]=Number(input.value);recalculate();save();
  }));
  for(const key of ['freeShipping','confirmedCosts','requirePromotion'])$('s-'+key).addEventListener('change',e=>{state.settings[key]=e.target.checked;recalculate();save();});
  $('s-priceMode').addEventListener('change',e=>{state.settings.priceMode=e.target.value;recalculate();save();});
}
function filterUI(){
  const f=state.filters,brands=[...new Set(products.map(p=>p.brand))].sort();
  $('more-filters').innerHTML=selectField('f-brand','Brand',[['all','All brands'],...brands.map(b=>[b,b])],f.brand)+selectField('f-gender','Supplier gender',[['all','All'],['Men','Men'],['Women','Women'],['Unisex','Unisex']],f.gender)+selectField('f-type','Item condition / type',[['all','All items'],['fragrance','Retail fragrance'],['tester','Tester'],['unboxed','Unboxed'],['gift set','Gift set'],['other','Other / check type']],f.type)+selectField('f-evidence','Popularity evidence',[['all','Any / unknown'],['bestseller','Retailer bestseller listing'],['shortlist','Popular workbook shortlist'],['high','Your high-interest mark'],['orders','Your recorded orders > 0'],['unknown','No popularity evidence']],f.evidence)+selectField('f-benchmark','Price research',[['all','All'],['matched','Available exact comparison'],['missing','No available exact comparison'],['review','Comparison needs review']],f.benchmark)+
    [['profitMin','Minimum direct profit ₱'],['profitMax','Maximum direct profit ₱'],['marginMin','Minimum margin %'],['sizeMin','Minimum bottle ml'],['sizeMax','Maximum bottle ml'],['supplierSavingMin','Minimum saving vs source RRP %']].map(([k,l])=>`<label class="field">${l}<input id="f-${k}" type="number" step="any" value="${esc(f[k])}" placeholder="Any"></label>`).join('');
  $('search').value=f.search;$('route-filter').value=f.route;$('sort').value=f.sort;$('page-size').value=f.pageSize;
  document.querySelectorAll('[data-category]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.category===f.category)));
  document.querySelectorAll('#more-filters input,#more-filters select').forEach(el=>el.addEventListener('input',()=>{state.filters[el.id.slice(2)]=el.value;page=1;renderTable();save();}));
}
function popularity(p){const o=state.overrides[p.id]||{};return {orders:value(o.ownOrders,null),bestseller:p.bestseller===true,manual:o.popularity||'unknown',shortlist:p.category==='popular'};}
function result(p){const o=state.overrides[p.id]||{},r=order([{p,qty:1}],state.settings,state.overrides);return {p,r,decision:route(p,r,state.settings,o),m:lowest(p),pop:popularity(p)};}
function recalculate(){results=products.map(result);renderTable();renderInspector();renderOrder();}
function renderTable(){
  const f=state.filters,terms=f.search.toLowerCase().trim().split(/\s+/).filter(Boolean);
  filtered=results.filter(x=>{
    const {p,r,m,pop,decision}=x;
    if(f.category!=='all'&&p.category!==f.category)return false;
    if(terms.some(t=>!p.search.includes(t)))return false;
    if(f.brand!=='all'&&p.brand!==f.brand)return false;
    if(f.gender!=='all'&&p.supplierGender.toLowerCase()!==f.gender.toLowerCase())return false;
    if(f.type!=='all'&&p.type!==f.type)return false;
    if(f.route!=='all'&&decision.key!==f.route)return false;
    if(f.benchmark==='matched'&&!m||f.benchmark==='missing'&&m||f.benchmark==='review'&&!p.marketReview?.length)return false;
    if(f.evidence==='bestseller'&&!pop.bestseller||f.evidence==='shortlist'&&!pop.shortlist||f.evidence==='high'&&pop.manual!=='high'||f.evidence==='orders'&&!(pop.orders>0)||f.evidence==='unknown'&&(pop.bestseller||pop.shortlist||pop.manual!=='unknown'||pop.orders>0))return false;
    for(const [key,val,isMin] of [['profitMin',r?.operating,true],['profitMax',r?.operating,false],['marginMin',r?.margin===null?null:r?.margin*100,true],['sizeMin',p.ml,true],['sizeMax',p.ml,false],['supplierSavingMin',p.rrp>0?(1-p.wholesale/p.rrp)*100:null,true]]){
      if(f[key]!==''&&f[key]!==null){if(!Number.isFinite(val))return false;if(isMin?val<Number(f[key]):val>Number(f[key]))return false;}
    }return true;
  });
  const descending=(a,b,key)=>(Number.isFinite(b.r?.[key])?b.r[key]:-Infinity)-(Number.isFinite(a.r?.[key])?a.r[key]:-Infinity);
  filtered.sort((a,b)=>f.sort==='profit'?descending(a,b,'operating'):f.sort==='margin'?descending(a,b,'margin'):f.sort==='cheapest'?(a.r?.paid??Infinity)-(b.r?.paid??Infinity):f.sort==='orders'?(b.pop.orders??-1)-(a.pop.orders??-1):f.sort==='popularity'?(b.pop.orders??0)-(a.pop.orders??0)||Number(b.pop.bestseller)-Number(a.pop.bestseller)||Number(b.pop.manual==='high')-Number(a.pop.manual==='high')||Number(b.pop.shortlist)-Number(a.pop.shortlist):a.p.name.localeCompare(b.p.name)||a.p.brand.localeCompare(b.p.brand));
  const size=Number(f.pageSize),pages=Math.max(1,Math.ceil(filtered.length/size));page=Math.min(page,pages);
  $('rows').innerHTML=filtered.slice((page-1)*size,page*size).map(({p,r,m,decision,pop})=>`<tr aria-selected="${state.selected===p.id}"><td><span class="brand">${esc(p.brand)}</span><span class="name">${esc(p.name)}</span><span class="meta">${esc(p.variant)} · SKU ${p.sku}</span><span class="meta">${pop.bestseller?'Retailer bestseller · ':''}${pop.shortlist?'Popular shortlist · ':''}${pop.orders!==null?`${pop.orders} own orders/month`:''}</span></td><td>${money(costs(p,state.settings,state.overrides[p.id])?.purchase)}<span class="meta">${p.currency==='Unverified source units'?'Source units unverified':'CSV labels PHP'}</span></td><td>${money(r?.paid)}<span class="meta">${state.overrides[p.id]?.price!==undefined?'Manual price':state.settings.priceMode==='market'&&m?'Matched item price':p.rrp>0?'RRP fallback estimate':'No RRP / add price'}</span></td><td>${m?`${money(m.price)}<a class="meta" href="${esc(m.url)}" target="_blank" rel="noopener">${esc(m.store)}</a>`:'<span class="meta">Not verified</span>'}</td><td class="${r?.operating<0?'negative':''}">${money(r?.operating)}</td><td>${pct(r?.margin)}</td><td><span class="route ${decision.key}">${decision.label}</span></td><td><button data-inspect="${p.id}" aria-label="Inspect ${esc(p.name)} ${esc(p.variant)} SKU ${p.sku}">Inspect</button></td></tr>`).join('')||'<tr><td colspan="8">No items match these filters. Clear filters to see the full catalog.</td></tr>';
  $('result-count').textContent=`${filtered.length.toLocaleString()} matching items · single-item order estimates · ${state.settings.confirmedCosts?'costs marked checked by you':'cost assumptions not confirmed'}`;
  $('page-label').textContent=`Page ${page} of ${pages}`;$('prev').disabled=page===1;$('next').disabled=page===pages;
  document.querySelectorAll('[data-inspect]').forEach(b=>b.addEventListener('click',()=>{state.selected=b.dataset.inspect;renderInspector();save();$('inspect').scrollIntoView({block:'start'});}));
}
function renderInspector(){
  const p=byId.get(state.selected)||products[0];state.selected=p.id;const o=state.overrides[p.id]||{},s=state.settings,r=order([{p,qty:1}],s,state.overrides),m=lowest(p),decision=route(p,r,s,o);
  $('selected-title').textContent=`${p.brand} · ${p.name}`;$('selected-meta').textContent=`${p.variant} · SKU ${p.sku} · ${p.supplierGender}${p.category!=='catalog'?` · ${p.category} workbook shortlist`:''}`;
  const input=(key,label,placeholder,min=0,max=1e9)=>`<label class="field">${label}<input data-product="${key}" type="number" min="${min}" max="${max}" step="any" value="${o[key]??''}" placeholder="${esc(placeholder)}"></label>`;
  $('product-fields').innerHTML=input('cost','Supplier unit cost override (source units)',p.wholesale)+input('discount','Extra supplier discount override %',s.supplierDiscount,0,100)+input('price','Item list-price override ₱',price(p,s)||'Needed')+input('kg','Unit weight override kg',weight(p,s))+
    selectField('p-stock','Supplier stock confirmation',[['unknown','Not checked'],['confirmed','Checked: available'],['unavailable','Checked: unavailable']],o.stock||'unknown')+
    selectField('p-popularity','Your interest assessment',[['unknown','Not assessed'],['low','Low'],['medium','Medium'],['high','High']],o.popularity||'unknown')+
    input('ownOrders','Your actual orders in one month','Unknown')+`<label class="field">Your affiliate tracking URL<input id="p-affiliateUrl" type="url" placeholder="https://…" value="${esc(o.affiliateUrl||'')}"><small>Use an approved tracking link. A retailer URL alone is not an affiliate link.</small></label><label class="field">Your research / quote note<input id="p-note" type="text" maxlength="1000" value="${esc(o.note||'')}" placeholder="Quote date, supplier or sales period"></label>`;
  document.querySelectorAll('[data-product]').forEach(el=>el.addEventListener('change',()=>{if(el.value!==''&&!el.checkValidity()){el.reportValidity();return;}const current=state.overrides[p.id]||={};if(el.value==='')delete current[el.dataset.product];else current[el.dataset.product]=Number(el.value);recalculate();save();}));
  for(const key of ['stock','popularity','affiliateUrl','note'])$('p-'+key).addEventListener('change',e=>{if(key==='affiliateUrl'&&e.target.value&&!safeURL(e.target.value)){e.target.setCustomValidity('Enter a complete http or https tracking URL.');e.target.reportValidity();return;}e.target.setCustomValidity('');(state.overrides[p.id]||={})[key]=e.target.value;recalculate();save();});
  $('selected-rule').innerHTML=`<strong>${decision.label}.</strong> ${esc(decision.reason)} ${decision.key==='affiliate'?(safeURL(o.affiliateUrl)?`<a href="${esc(safeURL(o.affiliateUrl))}" target="_blank" rel="noopener sponsored">Open your affiliate link</a>`:'Add your approved affiliate tracking URL before linking out.'):''}`;
  const targets=[.45,.50].map(t=>{const v=targetPrice([{p,qty:1}],s,state.overrides,t);return `<div class="target">List price for ${(t*100).toFixed(0)}% operating margin<b>${v?money(v.list):'Not achievable with these inputs'}</b><small>${v?`${money(v.paid)} paid after promo${m&&v.paid>m.price?` · ${money(v.paid-m.price)} above checked market item price`:''}`:'Check fee rates, order count and promotion.'}</small></div>`;}).join('');
  $('target-prices').innerHTML=targets;
  const offer=(x,excluded=false)=>`<div class="source-offer"><p><strong>${money(x.price)}</strong> · ${esc(x.store)} · ${x.available?'Listed available':'Listed sold out'}</p><a href="${esc(x.url)}" target="_blank" rel="noopener">${esc(x.title)} · ${esc(x.variant)}</a><small>${x.ml}ml · ${esc(x.concentration||'Concentration unspecified')} · ${esc(x.condition)} · checked ${x.checked}${excluded?' · EXCLUDED: '+esc(x.reason):''}</small></div>`;
  $('evidence').innerHTML=`<p class="sub small">${p.market?.length?'Comparable retail offers below exclude retailer delivery fees.':'No exact available comparison verified. Source RRP is not a market minimum.'}</p>${(p.market||[]).map(x=>offer(x)).join('')}${p.marketReview?.length?'<h3>Excluded comparisons</h3>'+p.marketReview.map(x=>offer(x,true)).join(''):''}<p class="rule">${p.bestseller?'<a target="_blank" rel="noopener" href="https://perfumerackph.com/collections/best-sellers">Listed in Perfume Rack PH’s Best Sellers collection</a>. ':'No retailer bestseller evidence matched. '}${p.category==='popular'?'Included in your Popular 100 workbook; its rank is a shortlist position.':'No verified national popularity rank.'}</p><p class="sub small">Source: ${esc(p.source)}${p.shortlistSource?` · ${esc(p.shortlistSource)}, ${esc(p.shortlistSheet)} row ${p.shortlistRow}`:''}. Supplier availability was not supplied in the new price CSV. Reference weights are catalog estimates.</p>${p.rrp>0?`<p class="sub small">Cost is ${(100*(1-p.wholesale/p.rrp)).toFixed(1)}% below source RRP. This is not evidence of a current wholesale promotion.</p>`:''}`;
}
function basketLines(){return state.basket.map(l=>({p:byId.get(l.id),qty:l.qty})).filter(l=>l.p);}
function line(label,v,cls='',hint=''){return `<div class="line ${cls}"><span>${esc(label)}${hint?`<small>${esc(hint)}</small>`:''}</span><b>${typeof v==='string'?esc(v):money(v)}</b></div>`;}
function renderOrder(preserveBasket=false){
  const lines=basketLines(),s=state.settings;
  $('order-quote').value=state.orderQuote??'';
  if(!preserveBasket){
  $('basket').innerHTML=lines.map(({p,qty})=>`<div class="basket-row"><p>${esc(p.brand)} · ${esc(p.name)}<small>${esc(p.variant)} · ${money(price(p,s,state.overrides[p.id]))} each before promo</small></p><label class="sr-only" for="qty-${p.id}">Quantity for ${esc(p.name)} SKU ${p.sku}</label><input id="qty-${p.id}" data-qty="${p.id}" type="number" min="1" max="10000" step="1" value="${qty}"><button data-remove="${p.id}" aria-label="Remove ${esc(p.name)} SKU ${p.sku}">Remove</button></div>`).join('')||'<p>No items in this estimate. Choose a fragrance above and add it.</p>';
  document.querySelectorAll('[data-qty]').forEach(el=>el.addEventListener('input',()=>{if(!el.checkValidity()||el.value===''){el.reportValidity();return;}state.basket.find(l=>l.id===el.dataset.qty).qty=Number(el.value);renderOrder(true);save();}));
  document.querySelectorAll('[data-remove]').forEach(el=>el.addEventListener('click',()=>{state.basket=state.basket.filter(l=>l.id!==el.dataset.remove);renderOrder();save();}));
  }
  const r=order(lines,s,state.overrides,{shippingQuote:state.orderQuote});
  $('weight-summary').textContent=r?`${r.quantity} item(s) · ${r.delivery.kg.toFixed(2)}kg estimated including outer packing · ${r.delivery.quoted?'supplier quote entered':'illustrative weight formula; confirm a supplier quote'}.`:'An item needs a valid price/cost, or the order is empty.';
  if(!r){$('receipt').innerHTML='<p>Add items with valid selling prices and supplier costs to calculate this order.</p>';$('monthly').textContent='Add a valid order estimate first.';$('stress').textContent='Add a valid order estimate first.';renderAffiliate();return;}
  $('receipt').innerHTML=line('Items before extra promo',r.list)+line(`Extra customer promo (${s.promo}%)`,-r.discount)+line('Items after promo',r.paid)+line('Customer pays shipping',r.delivery.customer,'',r.delivery.free?'Optional free-delivery threshold reached':'Your minimum / share rule; capped at actual shipping')+line('Customer pays in total',r.collected,'total')+line('Supplier purchase cost',-r.purchase)+line('Import / extra acquisition costs',-(r.importCost+r.inbound))+line('Actual supplier shipping',-r.delivery.actual,'','Deducted once per consolidated order')+line('Of that shipping, we cover',r.delivery.subsidy,'', 'Explanation only: already included above; not deducted again')+line('Gateway fees on items + shipping',-r.gateway)+line('Shopify fees on items + shipping',-r.shopify)+line('Fees included above on customer shipping',round(r.delivery.customer*(s.gateway+s.shopify)/100),'','Explanation only; not deducted again')+line('Item protection reserve',-r.protection)+line('Refund / loss reserve',-r.reserve)+line('Additional tax reserve',-r.taxReserve)+line('Extra packing / handling',-r.other)+line('Contribution before ads & fixed costs',r.contribution,'total')+line('Allocated direct ads',r.cac===null?'Needs monthly order count':-r.cac)+line('Allocated Shopify / apps / fixed costs',r.perOrder===null?'Needs monthly order count':-r.perOrder)+line('Estimated operating profit',r.operating,'total')+line('Operating margin on items',pct(r.margin))+`<p class="rule ${r.operating<0?'negative':''}">${r.operating<0?'This direct order loses money. Review an affiliate offer or increase the price.':'This is a forecast using the entered costs and prices.'} ${s.confirmedCosts?'You marked costs checked; supplier stock and affiliate terms remain separate.':'Costs and quotes are not confirmed.'}</p>`;
  const plan=monthly(r,s);
  $('monthly').innerHTML=`<p class="sub">${s.monthlyOrders.toLocaleString()} orders/month × this ${r.quantity}-item basket</p><div class="metrics">${line('Item revenue',plan.revenue)}${line('Shipping collected (separate)',plan.shippingCollected)}${line('Contribution before monthly costs',plan.contribution)}${line('Direct-sales ads (once)',-plan.ads)}${line('Shopify + apps + fixed costs (once)',-plan.fixed)}${line('Estimated operating profit',plan.operating,'total')}${line('Break-even orders at this basket',plan.breakEven===null?'Not reachable with negative contribution':String(plan.breakEven))}${line('Maximum ad cost per order before loss',r.maxCac)}</div><p class="sub small">Customer shipping is a delivery recovery, not merchandise sales. Stock and customer demand are unverified. No income tax beyond your entered reserve is calculated.</p>`;
  const stress=[['Current inputs',1,1],['Supplier / FX +10%',1.1,1],['Actual shipping +25%',1,1.25],['Both increases',1.1,1.25]].map(([label,fx,ship])=>{
    const sc={...s,fx:s.fx*fx,shippingBase:s.shippingBase*ship,extraShipping:s.extraShipping*ship};
    // Freeze item selling prices so FX affects purchase costs, not fallback revenue.
    const frozen={...state.overrides};for(const {p} of lines)frozen[p.id]={...(frozen[p.id]||{}),price:price(p,s,state.overrides[p.id])};
    const x=order(lines,sc,frozen,{shippingQuote:state.orderQuote===null?null:state.orderQuote*ship});
    return `<tr><td>${label}</td><td>${money(x?.delivery.subsidy)}</td><td>${money(x?.operating)}</td><td>${pct(x?.margin)}</td></tr>`;
  });
  $('stress').innerHTML=`<div class="table-scroll"><table class="stress-table"><thead><tr><th>Scenario</th><th>Shipping we cover</th><th>Order profit</th><th>Margin</th></tr></thead><tbody>${stress.join('')}</tbody></table></div>`;
  renderAffiliate();
}
function renderAffiliate(){const a=affiliate(state.settings);$('affiliate-output').innerHTML=`<div class="metrics">${line('Expected referred orders',a.conversions.toFixed(1))}${line('Commission after reversals',a.commission)}${line('Affiliate ads + assigned fixed costs',-(state.settings.affiliateAds+state.settings.affiliateFixed))}${line('Estimated affiliate profit',a.net,'total')}</div>`;}
function download(content,name,type){const url=URL.createObjectURL(new Blob([content],{type}));const a=document.createElement('a');a.href=url;a.download=name;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);}
function exportCSV(){
  const rows=[['SKU','Brand','Fragrance','Variant','Source currency','Purchase PHP','Paid item PHP','Customer shipping PHP','Actual shipping PHP','Seller subsidy PHP','Operating profit PHP','Operating margin','Recommendation','Market PHP','Market URL','Research date','Own monthly orders','Retailer bestseller','Affiliate URL']];
  for(const {p,r,m,pop,decision} of filtered)rows.push([p.sku,p.brand,p.name,p.variant,p.currency,r?.purchase,r?.paid,r?.delivery.customer,r?.delivery.actual,r?.delivery.subsidy,r?.operating,r?.margin,decision.label,m?.price,m?.url,data.date,pop.orders,pop.bestseller,state.overrides[p.id]?.affiliateUrl]);
  const cell=v=>{if(v===null||v===undefined)return '';const text=typeof v==='string'&&/^[=+\-@\t\r]/.test(v)?"'"+v:String(v);return '"'+text.replace(/"/g,'""')+'"';};
  download('\uFEFF'+rows.map(row=>row.map(cell).join(',')).join('\r\n'),'sangyo-bottle-pricing-results.csv','text/csv;charset=utf-8');
}
function bind(){
  $('apply-product').addEventListener('click',()=>{
    const current={...(state.overrides[state.selected]||{})};
    for(const el of document.querySelectorAll('[data-product]')){
      if(el.value!==''&&!el.checkValidity()){el.reportValidity();return;}
      if(el.value==='')delete current[el.dataset.product];else current[el.dataset.product]=Number(el.value);
    }
    for(const key of ['stock','popularity','affiliateUrl','note']){
      const el=$('p-'+key);
      if(key==='affiliateUrl'&&el.value&&!safeURL(el.value)){el.setCustomValidity('Enter a complete http or https tracking URL.');el.reportValidity();return;}
      current[key]=el.value;
    }
    state.overrides[state.selected]=current;recalculate();save();
  });
  for(const [id,key] of [['search','search'],['route-filter','route'],['sort','sort'],['page-size','pageSize']])$(id).addEventListener('input',()=>{state.filters[key]=$(id).value;page=1;renderTable();save();});
  document.querySelectorAll('[data-category]').forEach(b=>b.addEventListener('click',()=>{state.filters.category=b.dataset.category;page=1;filterUI();renderTable();save();}));
  $('clear-filters').addEventListener('click',()=>{state.filters={...FILTERS};page=1;filterUI();renderTable();save();});
  $('prev').addEventListener('click',()=>{page--;renderTable();});$('next').addEventListener('click',()=>{page++;renderTable();});
  $('add').addEventListener('click',()=>{const found=state.basket.find(l=>l.id===state.selected);if(found)found.qty++;else state.basket.push({id:state.selected,qty:1});renderOrder();save();$('order').scrollIntoView({block:'start'});});
  $('clear-basket').addEventListener('click',()=>{state.basket=[];renderOrder();save();});
  $('use-selected').addEventListener('click',()=>{state.basket=[{id:state.selected,qty:1}];renderOrder();save();});
  $('clear-product').addEventListener('click',()=>{delete state.overrides[state.selected];recalculate();save();});
  $('order-quote').addEventListener('input',e=>{if(e.target.value!==''&&!e.target.checkValidity()){e.target.reportValidity();return;}state.orderQuote=e.target.value===''?null:Number(e.target.value);renderOrder(true);save();});
  $('export').addEventListener('click',exportCSV);
  $('backup').addEventListener('click',()=>download(JSON.stringify(state,null,2),'sangyo-bottle-pricing-inputs.json','application/json'));
  $('restore-trigger').addEventListener('click',()=>$('restore').click());
  $('restore').addEventListener('change',async e=>{try{const file=e.target.files[0];if(!file)return;if(file.size>5e6)throw Error('Backup is too large (maximum 5 MB).');state=normalizeState(JSON.parse(await file.text()));settingsUI();filterUI();recalculate();save();$('saved').textContent='Backup restored and saved.';}catch(err){$('saved').textContent='Restore failed: '+err.message;}finally{e.target.value='';}});
  $('reset').addEventListener('click',()=>{if(!confirm('Reset only this bottle calculator’s inputs? Export a backup first if you need them.'))return;state=fresh();settingsUI();filterUI();recalculate();save();});
}
async function boot(){
  try{
    const response=await fetch('pricing/bottle-catalog.json');if(!response.ok)throw Error('Catalog could not be loaded.');data=await response.json();products=data.products;
    products.forEach(p=>{p.search=`${p.brand} ${p.name} ${p.variant} ${p.sku}`.toLowerCase();byId.set(p.id,p);});
    state=fresh();try{const old=localStorage.getItem(KEY);if(old)state=normalizeState(JSON.parse(old));}catch{$('saved').textContent='Saved data could not be read. Defaults loaded; your other calculators are unchanged.';}
    if(location.hash==='#popular'||location.hash==='#niche')state.filters.category=location.hash.slice(1);
    $('load-status').textContent=`${products.length.toLocaleString()} items loaded · research checked ${data.date} · local calculator`;
    const matched=products.filter(p=>lowest(p)).length;
    $('coverage').innerHTML=`<strong>${data.csvRows.toLocaleString()} CSV items + 9 workbook-only SKUs.</strong> ${matched} items have an available exact retail comparison among the checked stores. Others stay “Not verified”; missing RRP needs a manual selling price. CSV prices are labelled PHP. The nine old-workbook-only rows retain a currency warning. Supplier cost/stock are not live quotes. Shipping and protection are estimates.`;
    $('research-notes').innerHTML=`<p>${esc(data.method)}</p><p>Research date: ${data.date}. Each product’s inspector shows its actual matched variant URL and availability. Prices exclude competitor delivery unless the retailer states otherwise. Public listing data is not an independent authenticity check. Absence from these catalogs does not mean an item is unavailable elsewhere.</p><ul>${data.sources.map(x=>`<li><a href="${esc(x.url)}" target="_blank" rel="noopener">${esc(x.name)}</a>: ${x.catalogProducts.toLocaleString()} catalog products checked.</li>`).join('')}</ul><p>The supplied CSV has 3,838 missing retail prices. Wholesale discount from RRP and your extra supplier promotion are kept separate. Brands and approximate weights are joined by exact SKU from your existing supplier Shopify CSV. Its placeholder inventory counts are not used.</p><p>Popularity: <a href="https://perfumerackph.com/collections/best-sellers" target="_blank" rel="noopener">Perfume Rack PH Best Sellers</a> is a retailer collection, not audited sales data. A shortlist position is not a national popularity rank. Enter your own measured orders with the period in your research note.</p><p>Shipping rule: customer charge = min(actual shipping, max(customer minimum, actual shipping × customer share)). Your shipping subsidy is actual minus customer charge. Direct profit subtracts actual shipping and adds the customer charge once. Payment fees apply to both items and collected shipping.</p><p>Free delivery is off for this dropship scenario so the entered cost-sharing rule is used. You can enable the separate after-discount threshold to test the store’s policy. This page does not change that live policy, product prices or affiliate links.</p>`;
    settingsUI();filterUI();bind();recalculate();$('app').hidden=false;$('backup').disabled=false;$('reset').disabled=false;
  }catch(err){$('load-status').textContent=err.message+' Reload this page to retry; serve it from the local preview server.';$('load-status').className='notice error';}
}
boot();
