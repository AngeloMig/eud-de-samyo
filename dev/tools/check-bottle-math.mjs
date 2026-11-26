import assert from 'node:assert/strict';
import fs from 'node:fs';
import {DEFAULTS,order,lowest,route,targetPrice,monthly,affiliate} from '../pricing/bottle-math.mjs';
const s={...DEFAULTS,gateway:0,shopify:0,paymentFixed:0,reserve:0,protection:0,ads:0,plan:0,packingKg:0};
const p={id:'test',wholesale:2000,rrp:5000,grams:500,currency:'PHP (CSV header)',market:[]};
const overrides={test:{price:5000}};
let r=order([{p,qty:1}],s,overrides);
assert.equal(r.delivery.actual,1353.99);assert.equal(r.delivery.customer,750);assert.equal(r.delivery.subsidy,603.99);
assert.equal(r.operating,2396.01); // 5000 + 750 - 2000 - 1353.99
assert.equal(r.margin,2396.01/5000);
r=order([{p,qty:2}],s,overrides);assert.equal(r.delivery.actual,1353.99);assert.equal(r.operating,5396.01);
r=order([{p,qty:3}],s,overrides);assert.equal(r.delivery.actual,1703.99);assert.equal(r.delivery.customer,852);assert.equal(r.delivery.subsidy,851.99);
r=order([{p,qty:1}],{...s,gateway:3.5,shopify:2,paymentFixed:15},overrides);
assert.equal(r.gateway,216.25);assert.equal(r.shopify,115);assert.equal(r.operating,2064.76);
const quoted=order([{p,qty:1}],s,overrides,{shippingQuote:2000});assert.equal(quoted.delivery.customer,1000);assert.equal(quoted.delivery.subsidy,1000);
const exactHalf=order([{p,qty:1}],{...s,customerMin:0},overrides);assert.equal(exactHalf.delivery.customer,677);assert.equal(exactHalf.delivery.subsidy,676.99);
assert.equal(order([{p,qty:1}],s,overrides,{shippingQuote:2053.99}).delivery.customer,1027);
const free=order([{p,qty:2}],{...s,freeShipping:true},overrides);assert.equal(free.delivery.customer,0);
const below=order([{p,qty:2}],{...s,freeShipping:true,promo:1},overrides);assert.equal(below.paid,9900);assert.equal(below.delivery.customer,750);
const zero=order([{p,qty:1}],s,overrides,{shippingQuote:0});assert.equal(zero.delivery.customer,0);assert.equal(zero.delivery.actual,0);
const monthlySettings={...s,ads:6000,plan:1550,monthlyOrders:100};
r=order([{p,qty:1}],monthlySettings,overrides);let m=monthly(r,monthlySettings);
assert.equal(m.operating,239601-6000-1550);assert.equal(r.operating,2396.01-60-15.5);
assert.equal(route(p,r,{...s,minMargin:50},overrides.test).key,'affiliate');
assert.equal(route(p,r,{...s,minMargin:10},overrides.test).key,'direct');
assert.equal(route(p,r,{...s,minMargin:10},{}).key,'review');
assert.equal(route(p,r,{...s,minMargin:10},{...overrides.test,stock:'unavailable'}).key,'affiliate');
assert.equal(route(p,r,{...s,minMargin:10,requirePromotion:true},overrides.test).key,'affiliate');
assert.equal(route(p,order([{p,qty:1}],s,{test:{price:100}}),s).key,'affiliate');
assert.equal(affiliate({...DEFAULTS,affiliateClicks:1000,affiliateConversion:2,affiliateAov:6000,affiliateRate:5,affiliateReversal:10,affiliateAds:1000,affiliateFixed:100}).net,4300);
assert.equal(lowest({market:[{price:100,available:false,condition:'retail'},{price:200,available:true,condition:'tester'},{price:300,available:true,condition:'retail'}]}).price,300);
let checks=0;
for(const target of [.45,.5])for(const freeShipping of [false,true])for(const promo of [0,26,30,99])for(const shippingBase of [0,1353.99,5000])for(const cost of [0,2000,9000]){
  const settings={...DEFAULTS,freeShipping,promo,shippingBase};
  const item={...p,wholesale:cost};const result=targetPrice([{p:item,qty:1}],settings,overrides,target);
  if(result){const actual=order([{p:item,qty:1}],settings,{test:{price:result.list}});assert.ok(actual.margin>=target-0.00001,JSON.stringify({target,freeShipping,promo,shippingBase,cost,result,actual}));checks++;}
}
assert.notEqual(targetPrice([{p:{...p,rrp:null},qty:1}],s,{},.45),null);
assert.equal(order([],s),null);assert.equal(order([{p,qty:1}],{...s,monthlyOrders:0},overrides).operating,null);
assert.equal(order([{p,qty:1.5}],s,overrides),null);
const data=JSON.parse(fs.readFileSync(new URL('../pricing/bottle-catalog.json',import.meta.url)));
assert.equal(data.products.length,10359);assert.equal(new Set(data.products.map(p=>p.id)).size,10359);
assert.equal(data.products.filter(p=>p.source==='Pricelist -All Fragrances.csv').length,10350);
assert.equal(data.products.filter(p=>p.category==='popular').length,100);assert.equal(data.products.filter(p=>p.category==='niche').length,100);
assert.equal(data.products.filter(p=>p.currency==='Unverified source units').length,9);
for(const p of data.products){assert.ok(p.wholesale>=0);for(const m of p.market){assert.equal(m.ml,p.ml);assert.equal(m.concentration,p.concentration);assert.equal(m.condition,'retail');assert.ok(m.url.startsWith('https://'));}
  if(/\brefill\b|\+/i.test(p.variant))assert.equal(p.market.length,0);
  const r=order([{p,qty:1}],DEFAULTS);if(r)assert.ok(Math.abs(r.collected-r.landed-r.delivery.actual-r.gateway-r.shopify-r.reserve-r.protection-r.taxReserve-r.other-r.contribution)<.025);
}
// Aventus Cologne must never inherit the price of the different Aventus EDP.
const aventus=data.products.find(p=>p.sku==='547513');assert.ok(!aventus.market.some(o=>/Aventus EDP/.test(o.title)));
console.log(`PASS: shipping, subsidies, fee bases, monthly reconciliation, routing, affiliate math, ${checks} margin targets, 10,359 unique SKUs and comparison integrity.`);
