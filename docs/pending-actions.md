# Pending Actions — Beautiful Mess

A running list of things that still need to happen, but can't be done
from inside the code alone — either they need you (the store owner) to
do something outside this codebase, or they're waiting on something
else to happen first (like getting a real domain name). Written in
plain language, not developer-speak.

**How this list works:** when a new "needs your action later" item
comes up, it gets added here. Once it's actually done, it gets deleted
from this list — so everything below is still outstanding.

---

## Online presence / getting found on Google & Bing

1. **Verify the site with Google Search Console.** This is Google's free
   tool for seeing how your site shows up in search and fixing problems.
   Since the site doesn't have its own domain name yet, verify using the
   "HTML tag" method — Search Console will give you a short code, which
   you paste into the site's settings (ask for help pasting it in when
   you have the code — it's a one-line change). Do this before the
   others below.
2. **Submit the sitemap to Google Search Console** once verified (a
   couple of clicks in their dashboard — the sitemap itself already
   exists and updates automatically).
3. **Set up a Google Business Profile** for the real store (the
   Bengaluru address and phone number). This is what gets you onto
   Google Maps and shows up when someone searches "kidswear near me" —
   arguably more valuable than Search Console for a physical store.
   Google verifies this by mailing a postcard with a code to the store,
   which takes 1–2 weeks, so it's worth starting early.
4. **Set up Bing Webmaster Tools.** Quick — once Search Console is
   verified, Bing can import that verification and the sitemap
   automatically with one click.
5. *(Not worth doing yet)* IndexNow — Google doesn't support it, so it's
   low value at this size. Google Merchant Center — worth revisiting
   once the product catalog and pricing are finalized, not now.

## Waiting on a real domain name

6. **Once the store has its own domain** (instead of the current
   `.vercel.app` address): update the site's real address in its
   settings (`NEXT_PUBLIC_SITE_URL`) to the new domain, and re-verify
   ownership in Google Search Console using the new domain (a more
   thorough verification method becomes available once there's a real
   domain, which is worth switching to at that point).

## Marketing / growth

7. **Decide on a provider for abandoned-cart reminder messages**
   (email, SMS, or WhatsApp) before that feature can be built — this
   needs a real account/subscription with whichever service is chosen,
   which only you can set up.

## Catalog cleanup (flagged earlier, not yet actioned)

8. **Merge the duplicate "Sling Bags" listings.** 8 separate product
   listings are really only 3 bag designs in different colors — should
   become 3 products with color options instead.
9. **Double check frock/bag pricing.** Every frock is priced the same
   and every bag is priced the same, regardless of design — worth
   confirming these are the real intended prices, not import
   placeholders.
10. **Clean up outdated shipping information** shown to customers (a
    product page, the shipping policy page, and the terms page each
    quote different, outdated shipping costs, and none of them match
    what's actually charged today).
