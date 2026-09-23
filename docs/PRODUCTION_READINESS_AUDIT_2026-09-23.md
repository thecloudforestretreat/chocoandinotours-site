# Chocó Andino Tours production-readiness audit

Audit date: 2026-09-23  
Scope: 64 planned indexable URLs, 32 reciprocal English/Spanish page pairs

## Completed checks

- All 64 approved page paths have a corresponding HTML file.
- Every page has one unique title, meta description, H1 and self-canonical URL.
- Every pair has matching English, Spanish and `x-default` hreflang links.
- All JSON-LD blocks parse successfully.
- Every schema type required by the page plan is present, including valid WebPage subtypes such as CollectionPage and ContactPage.
- All local image references resolve and every image has useful alternative text.
- All approved internal links resolve after correcting four Spanish slug errors.
- All 388 in-page images now include intrinsic width and height attributes.
- Shared header and footer logo images include intrinsic dimensions.
- JavaScript and Ruby utility scripts pass syntax checks.
- Staging responses include `X-Robots-Tag: noindex, nofollow`.
- The form endpoint rejects requests without a valid Turnstile token before CRM delivery.
- The staging header is fixed and representative desktop, tablet and mobile layouts have no horizontal overflow.

## Sitemap and crawling

- `sitemap.xml` now contains all 64 approved production URLs.
- Every sitemap entry includes English, Spanish and `x-default` alternates.
- Priorities and change frequencies come from the approved page plan.
- `robots.txt` allows public pages, blocks `/api/`, and points to the production sitemap.
- Legacy `/home/`, `/testing/` and `/testing2/` paths redirect permanently to `/`.
- Production currently serves the earlier one-URL sitemap until the audited staging branch is promoted to `main`.

## Conversion and measurement

- Booking forms carry server-owned CAT source identifiers before the shared CRM handoff.
- Turnstile hostname and action validation occur server-side.
- A seven-second upstream timeout returns an accepted/processing response instead of showing a false failure while the CRM continues in the background.
- First- and last-touch attribution, campaign parameters, click IDs, visitor ID and session ID are attached to submissions.
- Analytics cover content views, 50% scroll, booking starts/submits/success/errors, CTA clicks, internal links, WhatsApp, email, outbound links and sister-site handoffs.
- Controlled English and Spanish staging submissions passed Turnstile and displayed the correct localized success state on the deployed audit build. Test names: `CAT Audit English` and `Auditoría CAT Español`; campaign: `codex_audit / qa / production_readiness`.
- Downstream inbox, sheet and CRM verification requires the owner's authenticated Gmail and Cloudflare Access sessions. Confirm both test records carry the CAT source before production promotion.

## Security and delivery

- HTTPS is active on staging and production.
- Repository headers now set HSTS, clickjacking protection, MIME sniffing protection, a strict referrer policy and a restrictive permissions policy.
- A full Content Security Policy is intentionally deferred until GTM, GA4 and Turnstile sources can be tested under report-only mode.

## Image work remaining

- 148 placeholder uses map to 74 shared bilingual replacement slots.
- The immediate replacement list is `docs/chocoandinotours-image-replacement-manifest.csv`.
- The complete 194-slot ideal shot list is `docs/chocoandinotours-full-image-shot-list.csv`.
- Existing photographs are reused heavily; replacing the 74 placeholder slots is the launch priority, while the complete list supports gradual page-level uniqueness.
- Hero source target: at least 1800 × 1350 pixels, with the subject safe inside the center square.
- Card source target: at least 1600 × 900 pixels, landscape.
- Originals should be supplied as high-quality JPG, TIFF or PNG files with commercial usage rights. Site copies should be exported to WebP at 400 KB or less for heroes and 250 KB or less for cards.

## Editorial advisories

- 28 pages are modestly below the aspirational word-count floors in the original planning sheet. They are substantive pages rather than empty or doorway pages, so filler was not added merely to reach a number. Expand them only when new verified local knowledge, logistics, prices, partners or original imagery provide genuine value.

## Remaining launch gate

1. Review and replace the priority image queue.
2. Deploy this audit build to staging.
3. Verify the two completed audit submissions in the guest inbox, admin inbox, sheet and CRM, including the CAT source tag and attribution fields.
4. Crawl the deployed staging sitemap and confirm all 64 URLs return 200 with no browser console errors.
5. Approve promotion from `staging` to `main`.
6. Confirm production canonical redirects, robots and sitemap.
7. Submit `https://chocoandinotours.com/sitemap.xml` in Google Search Console and request indexing for the principal English and Spanish hubs.
