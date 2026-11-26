// PHP throughout. Source quotes remain estimates; delivery is charged once per parcel.
export const DEFAULTS = Object.freeze({
  fx:1, supplierDiscount:0, importReserve:0, inboundPerBottle:0,
  gateway:3.5, shopify:2, paymentFixed:15, reserve:2, protection:0.5,
  packing:0, handling:0, taxReserve:0, plan:1550, apps:0, otherFixed:0,
  ads:6000, monthlyOrders:100, minMargin:45, minProfit:500, requirePromotion:false,
  priceMode:'market', retailDiscount:10, undercut:0, promo:0,
  shippingBase:1353.99, baseKg:1, stepKg:0.5, extraShipping:350,
  packingKg:0.2, fallbackKg:0.5, customerMin:750, customerShare:50,
  freeShipping:false, freeThreshold:10000, shippingQuote:null,
  affiliateRate:0, affiliateClicks:0, affiliateConversion:0, affiliateAov:0,
  affiliateReversal:0, affiliateAds:0, affiliateFixed:0, confirmedCosts:false
});
export const round = n => Math.round((n + Number.EPSILON*Math.max(1,Math.abs(n))) * 100) / 100;
export const ceil5 = n => Math.ceil((n - 1e-8) / 5) * 5;
export function value(override, fallback) { return override === '' || override === null || override === undefined ? fallback : Number(override); }
export function lowest(p) { return (p.market || []).filter(o=>o.available && o.condition==='retail' && o.price>0).sort((a,b)=>a.price-b.price)[0] || null; }
export function costs(p, s, o={}) {
  const raw=value(o.cost,p.wholesale), discount=value(o.discount,s.supplierDiscount);
  if(!Number.isFinite(raw) || raw<0 || !(s.fx>0) || discount<0 || discount>100) return null;
  const purchase=round(raw*s.fx*(1-discount/100));
  const importCost=round(purchase*s.importReserve/100),inbound=round(s.inboundPerBottle);
  return {purchase, importCost, inbound, landed:round(purchase+importCost+inbound), discount};
}
export function price(p,s,o={}) {
  if(o.price !== undefined && o.price !== '' && o.price !== null) return Number(o.price);
  const m=lowest(p);
  if(s.priceMode==='market' && m) return round(m.price*(1-s.undercut/100));
  if(!(p.rrp>0)) return null;
  return round(p.rrp*s.fx*(1-s.retailDiscount/100));
}
export function weight(p,s,o={}) { return value(o.kg, p.grams>0 ? p.grams/1000 : s.fallbackKg); }
export function shipping(kg, paid, s, quote=s.shippingQuote) {
  if(!(s.baseKg>0) || !(s.stepKg>0) || kg<0) return null;
  const steps=Math.max(0,Math.ceil((kg-s.baseKg-1e-9)/s.stepKg));
  const actual=round(value(quote,s.shippingBase+steps*s.extraShipping));
  if(!Number.isFinite(actual) || actual<0) return null;
  const free=s.freeShipping && paid>=s.freeThreshold;
  const customer=free?0:round(Math.min(actual,Math.max(s.customerMin,actual*s.customerShare/100)));
  return {actual,customer,subsidy:round(actual-customer),kg,steps,free,quoted:quote!==null&&quote!==''&&quote!==undefined};
}
export function order(lines,s,overrides={}, options={}) {
  if(!lines.length)return null;
  let list=0,landed=0,purchase=0,importCost=0,inbound=0,kg=s.packingKg,quantity=0;
  const detail=[];
  for(const {p,qty} of lines){
    if(!Number.isInteger(qty)||qty<1)return null;
    const o=overrides[p.id]||{},c=costs(p,s,o),unit=price(p,s,o),w=weight(p,s,o);
    if(!c || !Number.isFinite(unit) || unit<0 || !Number.isFinite(w) || w<0)return null;
    list+=round(unit*qty);landed+=round(c.landed*qty);purchase+=round(c.purchase*qty);
    importCost+=round(c.importCost*qty);inbound+=round(c.inbound*qty);kg+=w*qty;quantity+=qty;
    detail.push({id:p.id,qty,list:round(unit*qty),unit,cost:round(c.landed*qty)});
  }
  list=round(list); const discount=round(list*s.promo/100),paid=round(list-discount);
  const delivery=shipping(round(kg),paid,s,options.shippingQuote===undefined?s.shippingQuote:options.shippingQuote);
  if(!delivery)return null;
  const collected=round(paid+delivery.customer),gateway=round(collected*s.gateway/100+s.paymentFixed),shopify=round(collected*s.shopify/100);
  const reserve=round(paid*s.reserve/100),protection=round(paid*s.protection/100),taxReserve=round(paid*s.taxReserve/100);
  const other=round(s.packing+s.handling);
  const contribution=round(collected-landed-delivery.actual-gateway-shopify-reserve-protection-taxReserve-other);
  const overhead=round(s.plan+s.apps+s.otherFixed),perOrder=s.monthlyOrders>0?overhead/s.monthlyOrders:null;
  const cac=s.monthlyOrders>0?s.ads/s.monthlyOrders:null;
  const operating=perOrder===null?null:round(contribution-perOrder-cac);
  return {list,discount,paid,collected,quantity,landed:round(landed),purchase:round(purchase),importCost:round(importCost),inbound:round(inbound),
    delivery,gateway,shopify,reserve,protection,taxReserve,other,contribution,overhead,perOrder,cac,operating,
    margin:operating!==null&&paid>0?operating/paid:null,cashMargin:operating!==null&&collected>0?operating/collected:null,
    maxCac:perOrder===null?null:round(contribution-perOrder),detail};
}
// Solve two delivery branches explicitly; crossing the free-delivery threshold
// creates a discontinuity, so a monotonic binary search would be incorrect.
export function targetPrice(lines,s,overrides={},target=0.45) {
  const pricingOverrides={...overrides};
  for(const {p} of lines)if(price(p,s,overrides[p.id])===null)pricingOverrides[p.id]={...(overrides[p.id]||{}),price:0};
  const base=order(lines,s,pricingOverrides);if(!base||s.monthlyOrders<=0||s.promo>=100)return null;
  const rate=(s.gateway+s.shopify+s.reserve+s.protection+s.taxReserve)/100;
  const denominator=1-rate-target;if(denominator<=0)return null;
  const normal=shipping(base.delivery.kg,0,{...s,freeShipping:false});
  if(!normal)return null;
  const fixed=base.landed+normal.actual+s.paymentFixed+s.packing+s.handling+(s.plan+s.apps+s.otherFixed+s.ads)/s.monthlyOrders;
  const candidates=[];
  for(const customer of s.freeShipping?[normal.customer,0]:[normal.customer]){
    let paid=(fixed-customer*(1-(s.gateway+s.shopify)/100))/denominator;
    if(s.freeShipping && customer===0) paid=Math.max(paid,s.freeThreshold);
    let list=ceil5(Math.max(0,paid)/(1-s.promo/100));
    const actualPaid=round(list*(1-s.promo/100));
    if(s.freeShipping && customer!==0 && actualPaid>=s.freeThreshold)continue;
    const quote=shipping(base.delivery.kg,actualPaid,s);
    if(!quote || quote.customer!==customer)continue;
    const c=round(actualPaid+customer-base.landed-quote.actual-round((actualPaid+customer)*s.gateway/100+s.paymentFixed)-round((actualPaid+customer)*s.shopify/100)-round(actualPaid*s.reserve/100)-round(actualPaid*s.protection/100)-round(actualPaid*s.taxReserve/100)-s.packing-s.handling);
    const operating=c-(s.plan+s.apps+s.otherFixed+s.ads)/s.monthlyOrders;
    if(actualPaid>0 && operating/actualPaid>=target-0.00001)candidates.push({list,paid:actualPaid});
    else {
      // Cent rounding may miss by a few centavos; one price step resolves it.
      list+=5;
      const retryPaid=round(list*(1-s.promo/100));
      const retryShip=shipping(base.delivery.kg,retryPaid,s);
      if(retryShip?.customer===customer)candidates.push({list,paid:retryPaid});
    }
  }
  return candidates.sort((a,b)=>a.list-b.list)[0]||null;
}
export function route(p,r,s,o={}) {
  if(o.stock==='unavailable')return {key:'affiliate',label:'Affiliate candidate',reason:'Supplier marked unavailable; check a merchant offer and your approved tracking link.'};
  if(!r || r.operating===null)return {key:'review',label:'Needs inputs',reason:'Add a selling price and a positive monthly order count.'};
  if(r.operating<0 || r.operating<s.minProfit || r.margin<s.minMargin/100 || (s.requirePromotion&&value(o.discount,s.supplierDiscount)<=0))
    return {key:'affiliate',label:'Affiliate candidate',reason:r.operating<0?'Direct sale loses money.':s.requirePromotion&&value(o.discount,s.supplierDiscount)<=0?'No confirmed extra supplier discount.':'Direct profit is below your minimum profit or margin.'};
  if(p.currency==='Unverified source units' || (!lowest(p) && (o.price===undefined||o.price===null||o.price===''||!Number.isFinite(Number(o.price)))))
    return {key:'review',label:'Review first',reason:'Confirm the supplier currency and a comparable selling price.'};
  return {key:'direct',label:'Direct-sale candidate',reason:o.stock==='confirmed'?'Meets your profit rules; confirm the current supplier quote before sale.':'Meets your profit rules; supplier stock still needs confirmation.'};
}
export function monthly(r,s) {
  if(!r)return null;
  const contribution=round(r.contribution*s.monthlyOrders),fixed=round(s.plan+s.apps+s.otherFixed);
  return {revenue:round(r.paid*s.monthlyOrders),shippingCollected:round(r.delivery.customer*s.monthlyOrders),
    contribution,ads:s.ads,fixed,operating:round(contribution-s.ads-fixed),
    breakEven:r.contribution>0?Math.ceil((s.ads+fixed)/r.contribution):null};
}
export function affiliate(s) {
  const conversions=s.affiliateClicks*s.affiliateConversion/100;
  const commission=round(conversions*s.affiliateAov*s.affiliateRate/100*(1-s.affiliateReversal/100));
  return {conversions,commission,net:round(commission-s.affiliateAds-s.affiliateFixed)};
}
