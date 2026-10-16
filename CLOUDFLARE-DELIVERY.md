# Postcards Cloudflare delivery candidate

This source prepares the public PostcardPop app for Workers. Production migration and canonical routing remain incomplete; no production Worker, credentials or data stores are created by this follow-up.

## Checks and runner boundary

Validation runs a frozen Bun install, TypeScript/production build, unit and Worker/readiness tests, real-map Cypress edit/copy/share/receive tests in both themes, and three Lighthouse runs with the original recommended assertions. Lighthouse is mandatory for both deployment and `ci-required`; skipped or failing stages cannot make the aggregate succeed. No audit threshold or error assertion is relaxed.

This repository is public. The existing `thoughtbubble-ci*` fleet is restricted to private organization repositories and must never receive its jobs. Every job uses the operator-owned `PUBLIC_CI_RUNNER_LABEL`, rejects the private fleet prefix, and otherwise falls back to the unschedulable `public-ci-onboarding-required` label. That fallback creates no runner. A separately approved isolated public-repository route and an existing `CLOUDFLARE_API_TOKEN` are still required. No variable, runner grant, visibility, credential or shared infrastructure change is made here. Fork code remains blocked before checkout/install.

## Delivery and evidence

Trusted PRs use a route-free `postcards-pr-N` target. The validated build is transferred as a SHA-bound artifact with a digest manifest. Deployment credentials appear only in the deploy step. Production execution serializes without cancellation. `__version` readiness retries only GET requests, requires HTTP 200 with the exact expected SHA, and fails closed after bounded attempts; it never retries uploads.

The existing preview https://postcards-pr-14.bsunter.workers.dev remains at the previously accepted runtime SHA `6a17398a73ec0826dbb743e5c2425a762990e77a`. Its health/header/SPA and two synthetic browser round trips were verified. The current Lighthouse fixes and public runner selector are source-only follow-ups and have not replaced that preview. No production or canonical-domain acceptance is claimed.

## Measured Lighthouse fixes

The source now names tutorial progress, uses accessible light/dark contrast tokens, requests geolocation only after an explicit action, and preserves manual city entry on denial. It serves responsive local AVIF variants of the same default photo and leaves custom image URLs unchanged. Map code loads only when the back is opened. A small React-compatible Preact runtime removes measured unused initial renderer bytes; the manifest is bundled with origin-correct installation URLs, initial CSS is embedded, and optional fonts do not block initial rendering.

Before: the seven original failures included progressbar naming, contrast, startup geolocation, image delivery, a critical request chain, unused JavaScript and responsive images. After: the unchanged three-run Lighthouse gate passes; performance scores are 95/100/100 and the other three categories score 100 throughout. The image-delivery insight reports no optimizable images; the other six targeted audits score 1 in every run. Five unit tests, five Worker/readiness tests and both Cypress round trips pass.

Selected reference material comes from the still-separate [PR13](https://github.com/briansunter/postcards/pull/13), fixed head `31056d300bc9f2733670c2c11d0cf9df6a526e75`: the extracted map module, original-photo AVIF variants and relevant progress/contrast/location/initial-asset techniques. The 700-pixel AVIF is additionally compressed from 18,537 to 14,819 bytes at unchanged dimensions. The branch was not merged wholesale. PR14 retains its own CI and migration history.
