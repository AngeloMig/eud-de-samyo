// Audit actual base revenue and independently reconcile every variable charge.
// Also regenerates the local preview snapshot via the exporter.
import assert from 'node:assert/strict';
import { a, s, list, prices, model, result } from './export-decant-preview.mjs';
const near=(actual,expected)=>assert.ok(Math.abs(actual-expected)<1e-6,`${actual} != ${expected}`);
assert.equal(list.length,11);
assert.ok(list.some(x=>x.p[0]==='lightblue'));
assert.equal(list.find(x=>x.p[0]==='bright').p[4],90);
assert.ok(!list.some(x=>['oud','dylan'].includes(x.p[0])));
near(a.LIVE.sauvage[0],381.10);
near(a.LIVE.sauvage[1],710.40);
assert.equal(s.d6,0);
near(list.reduce((n,x)=>n+a.bottle(x.p),0),65226.74);
let checked=0;
for (const set of a.SETS) for (const indices of a.combos(list.length,set[2])) {
 const v=indices.map(i=>list[i]),unit=v.map(x=>prices[x.p[0]][a.SI[set[3]]]);
 const r=a.order(set,v,unit,model);
 const revenue=Math.round(unit.reduce((n,p)=>n+p,0)*100)/100;
 near(r.price,revenue); // no discount on prices that already are the in-set base
 assert.equal(r.off,0);
 const perfume=v.reduce((n,x)=>n+set[3]*x.pm,0);
 const supplies=v.length*(s.vial[set[3]]+s.lab+s.fill)+s.box+s.packl;
 const free=revenue>=s.delivery.threshold,carrier=s.delivery[s.zone];
 const shippingBuyer=free?0:carrier;
 const protection=Math.round(Math.max(0,revenue-s.delivery.protectionExcess)*s.delivery.protection)/100;
 const processing=(revenue+shippingBuyer)*s.fee+s.ffee;
 const shopify=(revenue+shippingBuyer)*s.shop,reserve=revenue*s.allow;
 const cost=perfume+supplies+processing+shopify+reserve+protection+(free?carrier:0)+s.deliv;
 near(r.cost,cost);near(r.contrib,revenue-cost);checked++;
}
// Known live trio, checked without using prices from the model under test.
const v=['eros','one','terre'].map(id=>list.find(x=>x.p[0]===id));
const r=a.order(a.SETS[0],v,[196.10,196.10,203.50],model);
near(r.price,595.70);near(r.paymentTotal,680.70);near(r.contrib,322.87331052631583);
// One 100ml bottle: full perfume cost (including any unusable remainder) is expensed once.
for(const x of list) for(const ml of a.SIZES){
 const e=a.bottleEcon(x,ml,prices[x.p[0]][a.SI[ml]],model,a.fixedStatus());
 near(e.contrib-e.ads-e.over,e.op);
 near(e.revenue-e.cash,e.op);
 near(Math.floor(x.p[4]*(1-s.loss)/ml+1e-9),e.vials);
}
const shares=a.MIX.map(x=>x[1]),u100=a.monthlyScentUsage({...s,orders:100},list,shares,'avg');
near(Object.values(u100).reduce((n,x)=>n+x,0),590);
near(95/u100.sauvage,1.771186440677966);
near(85.5/u100.bright,1.5940677966101695);
const u1000=a.monthlyScentUsage({...s,orders:1000},list,shares,'avg');
near(u1000.sauvage,10*u100.sauvage);
const cheap=a.monthlyScentUsage({...s,orders:100},list,shares,'cheap');
assert.ok(Object.values(cheap).some(n=>n===0));
assert.equal(a.monthlyScentUsage({...s,orders:0},list,shares,'avg'),null);
assert.equal(a.monthlyScentUsage(s,list,[0,0,0,0,0,0],'avg'),null);
const f=result.forecast;
near(Math.round((f.netContribution-f.ads-f.fixedCost)*100)/100,f.operatingBeforeTax);
// Allocating one order's ads across its different scents must conserve the
// whole-store monthly budget, even when full-bottle totals exceed that budget.
const x=list.find(x=>x.p[0]==='lightblue');
for(const monthlyOrders of [20,100,1000])for(const [ml,count] of [[1,3],[2,3],[5,2],[10,1]]){
 const scenario={...model,ads:6000,orders:monthlyOrders,cac:6000/monthlyOrders};
 const e=a.bottleEcon(x,ml,prices.lightblue[a.SI[ml]],scenario,a.fixedStatus());
 near(e.ads/e.vials*count*monthlyOrders,6000);
 if(ml===1)near(e.ads,95/3*(6000/monthlyOrders));
}
console.log(`Passed ${checked} set combinations; solo/base conversion; no extra six discount; known trio cost reconciliation; 44 bottle scenarios; bottle duration at 100/1000 orders; zero-demand and invalid inputs.`);
