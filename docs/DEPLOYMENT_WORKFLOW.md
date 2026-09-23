# Deployment workflow

## Active infrastructure

- GitHub repository: `thecloudforestretreat/chocoandinotours-site`
- Cloudflare Pages project: `chocoandinotours-site`
- Production branch: `main`
- Preview branch: `staging`
- Production hostname: `https://chocoandinotours.com/`
- Pages hostname: `https://chocoandinotours-site.pages.dev/`
- Staging hostname: `https://staging.chocoandinotours.com/`
- Staging branch alias: `https://staging.chocoandinotours-site.pages.dev/`

The separate Cloudflare Pages project named `chocoandinotours` is not connected
to the live domain or the active GitHub deployment workflow. Do not configure,
rename, or delete it until it has been reviewed as an obsolete project.

## Branch policy

1. Build and commit page pairs on `staging`.
2. Wait for the Cloudflare preview deployment to complete.
3. Validate English and Spanish parity, links, metadata, schema, forms,
   analytics events, responsive layout, and the noindex preview header.
4. Merge the approved commit into `main`.
5. Validate the production deployment and custom domain.

## Cloudflare environments

The production environment currently contains encrypted variables for:

- `BOOK_TOUR_APPS_SCRIPT_URL`
- `CF_SHARED_SECRET`
- `TURNSTILE_SECRET_KEY`

Preview currently has no configured variables. Add separate preview values
before testing booking forms on staging. Never commit secret values to Git.

## Indexing safeguards

- The `Noindex staging hostname` Cloudflare Response Header Transform Rule
  must retain `X-Robots-Tag: noindex, nofollow` for
  `staging.chocoandinotours.com` only.
- Canonicals and hreflang URLs should point to production URLs even while a
  page is reviewed on the preview hostname.
- Submit the production sitemap to Search Console only after the complete
  sitemap and production crawl pass are approved.

## Measurement and search ownership

- Google Analytics 4 property: `Choco Andino Tours`
- GA4 web stream: `Choco Andino Tours Website`
- GA4 measurement ID: `G-737ZDQNTDX`
- Google Tag Manager account: `ChocoAndinoTours`
- GTM web container: `chocoandinotours.com`
- GTM container ID: `GTM-NSBP2KS8`
- Google Search Console domain property: `sc-domain:chocoandinotours.com`

The site loads GTM through `assets/js/site-config.js` and
`assets/js/head.js`. GA4 is configured inside GTM and must not also be loaded
directly with `gtag.js`, which would duplicate page views. The Search Console
domain property is DNS verified. Submit `sitemap.xml` only after the final
production sitemap and crawl audit are approved.

## Release checklist

- Cloudflare deployment successful
- No broken internal links or missing assets
- Unique title, description, H1, canonical and reciprocal hreflang
- Structured data validates and reflects visible content
- English and South American Spanish pages are equivalent in scope
- Forms pass success, failure and duplicate-submission tests
- Turnstile uses environment-specific keys
- GA4/GTM events appear in preview/debug tools before production release
- Production sitemap contains only canonical, indexable URLs
