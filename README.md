# Chocó Andino Tours

Source repository for [chocoandinotours.com](https://chocoandinotours.com/).

## Deployment workflow

- `main` is the production branch and deploys to the live custom domain.
- `staging` is the review branch and deploys automatically to
  `https://staging.chocoandinotours.com/`.
- Page work is reviewed on staging before it is merged into `main`.
- The staging hostname is excluded from indexing with a Cloudflare response
  header rule that sets `X-Robots-Tag: noindex, nofollow`.

The approved bilingual page inventory is maintained in the
[Chocó Andino Tours page-plan sheet](https://docs.google.com/spreadsheets/d/1yZYHec767G41iQauQKB4_a61B7X7CTuSSnNnXner9JE/edit?gid=1940166229#gid=1940166229).

See `docs/DEPLOYMENT_WORKFLOW.md` for infrastructure details and launch checks.
