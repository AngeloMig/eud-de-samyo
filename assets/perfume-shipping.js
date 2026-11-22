/* Shared PHP delivery estimates for the theme and local pricing calculator.
   Checkout rates are configured separately in Shopify Shipping and delivery. */
((root) => {
  const defaults = Object.freeze({ threshold: 10000, ncr: 85, luzon: 178, visayas: 212, mindanao: 234, protection: 1, protectionExcess: 500 });
  const zones = Object.freeze({ ncr: 'NCR', luzon: 'Other Luzon', visayas: 'Visayas', mindanao: 'Mindanao' });
  function quote(subtotalCents, zone, options = {}) {
    const s = { ...defaults, ...options };
    if (!Object.hasOwn(zones, zone) || !Number.isInteger(subtotalCents) || subtotalCents < 0) return null;
    if (['threshold', zone, 'protection', 'protectionExcess'].some(key => !Number.isFinite(s[key]) || s[key] < 0)) return null;
    const free = subtotalCents >= Math.round(s.threshold * 100);
    const carrier = subtotalCents === 0 ? 0 : Math.round(s[zone] * 100);
    const protection = Math.round(Math.max(0, subtotalCents - Math.round(s.protectionExcess * 100)) * s.protection / 100);
    return { free, carrier, protection, customer: free ? 0 : carrier, seller: (free ? carrier : 0) + protection,
      remaining: Math.max(0, Math.round(s.threshold * 100) - subtotalCents) };
  }
  const api = Object.freeze({ defaults, zones, quote });
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.SamyoShipping = api;
})(globalThis);
