# Claude prompt: finish and verify Sangyó delivery

Work in /Users/angelomiguel/GitHub/samyo-theme. Read AGENTS.md and docs/HANDOFF.md first. Inspect the current implementation before editing; delivery work may already be present.

Use this policy for Sangyó in-house orders only:
- Customer pays standard delivery below PHP 10,000.
- Standard delivery is free at PHP 10,000 and above AFTER all item/order discounts, before taxes and delivery fees.
- Affiliate full-bottle purchases follow the retailer's delivery policy and do not count toward the threshold.
- Working origin is Metro Manila; confirm the actual dispatch city before publishing courier promises.
- Current small-parcel delivery estimates including listed fuel surcharge: NCR PHP 85, other Luzon PHP 178, Visayas PHP 212, Mindanao PHP 234. These are editable estimates, not guaranteed carrier quotes.
- Model item protection as a Sangyó expense: estimated 1% of declared value over PHP 500. At PHP 10,000 this is PHP 95. Confirm the provider's actual fee and coverage; the published protection pages are not entirely consistent.

Check assets/perfume-shipping.js, snippets/perfume-delivery-rates.liquid, Theme settings > Sangyó delivery and dev/decant-pricing.html. Display rates in the bag, cart page, homepage delivery FAQ and product shipping details. The cart progress bar must use the discounted PHP subtotal and handle the exact threshold inclusively.

In the calculator, show destination, carrier cost, protection, customer delivery charge, seller delivery expense and contribution after those costs. Below the threshold, customer delivery offsets carrier delivery; fees on shipping receipts and seller-paid protection still count as expenses. At/above the threshold, deduct the complete carrier and protection expense once. Never subtract shipping twice from an already fully costed margin. Preserve existing perfume data and exclude affiliate sales from Sangyó shipping calculations.

Checkout configuration is separate from theme code. In Shopify Settings > Shipping and delivery, use one in-house shipping profile/location group where possible, PHP currency, and four non-overlapping regional zones. Configure a paid Standard delivery rate from PHP 0 to 9,999.99 and a PHP 0 Standard delivery rate from PHP 10,000 upward in each zone. Use actual supported province/address boundaries; use a shipping app if the native zones cannot express the required coverage. Avoid profile combinations that double-charge shipping. Do not claim checkout is configured until a fresh checkout proves it.

Verify totals of PHP 9,999.99, 10,000 and 10,000.01, plus a PHP 10,500 basket discounted below 10,000. Verify all four destinations, customer versus seller charges, calculator margins and mobile layout. Confirm perfume-decant acceptance, packaging and route with the courier before publishing transit times. Preserve unrelated changes and report what remains for Shopify admin setup.

Sources:
https://www.gogoxpress.com/pricing/
https://help-center.gogoxpress.com/hc/en-us/articles/6912483339151-How-much-are-the-fees
https://help-center.gogoxpress.com/hc/en-us/articles/7684248007695-ANNEX-4-3-4-8-Cargo-Restrictions-Prohibited-Goods-and-Packaging-Policy
https://help.shopify.com/en/manual/fulfillment/setup/shipping-rates/troubleshooting
