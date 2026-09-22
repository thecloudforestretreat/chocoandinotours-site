# Chocó Andino Tours

Source repository for [chocoandinotours.com](https://chocoandinotours.com/).

## Deployment workflow

- `main` is the production branch and deploys to the live custom domain.
- `staging` is the review branch and deploys automatically to
  `https://staging.chocoandinotours.com/`.
- Page work is reviewed on staging before it is merged into `main`.
- The staging hostname is excluded from indexing with a Cloudflare response
  header rule that sets `X-Robots-Tag: noindex, nofollow`.

The approved bilingual page inventory is stored in
`planning/chocoandinotours-page-plan-2026-09-22.csv`.

See `docs/DEPLOYMENT_WORKFLOW.md` for infrastructure details and launch checks.
