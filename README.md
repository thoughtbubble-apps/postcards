# PostcardPop

Create & share beautiful digital postcards.

## Tech Stack

- **React 19** + TypeScript
- **Vite** — build tool and dev server
- **Bun** — package manager and runtime
- **Vitest** — unit testing
- **Cypress** — E2E testing
- **Leaflet** — interactive maps via react-leaflet

## Development

```bash
bun install
bun run dev
```

Open [http://localhost:5173](http://localhost:5173)

## Build

```bash
bun run build
```

Output goes to `build/` directory.

## Test

```bash
bun run test        # run once
bun run test:watch  # watch mode
```

## CI/CD

GitHub Actions workflows for:

- Building and deploying to GitHub Pages on push to `master`
- Running unit tests on pull requests
- Cypress E2E tests
- Lighthouse performance audits

The bundled default Alps photograph comes from
[Unsplash](https://images.unsplash.com/photo-1506905925346-21bda4d32df4) (image asset
`photo-1506905925346-21bda4d32df4`). Its AVIF variants keep the initial card
available without an external image request. Custom photo URLs are used unchanged.
