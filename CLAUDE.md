# CLAUDE.md

## Overview

oni-ui is a Vue 3 + TypeScript discovery portal for browsing research metadata in RO-Crate format. The UI is configuration-driven — search fields, facets, metadata display, branding, and navigation are all controlled by `/public/configuration.json`, validated at runtime with Zod.

## Commands

- `pnpm run dev` — start dev server (Vite, port 5173)
- `pnpm run build` — production build (type-check + vite build in parallel)
- `pnpm run test:unit` — run tests (Vitest with jsdom)
- `pnpm run lint:biome` — lint and format check (Biome)
- `pnpm run lint:types` — type checking (`vue-tsc`)
- `pnpm run lint:knip` — detect unused exports/dependencies

Pre-commit hooks (lefthook) run `lint:biome`, `lint:types`, and `lint:knip` in parallel. Commit messages must follow conventional commits (`commitlint`).

## Architecture

### Stack

Vue 3 (Composition API, `<script setup>`) + TypeScript + Vite + Tailwind CSS 4 + Element Plus + Pinia

### Key directories

- `src/views/` — page-level components, one per route
- `src/components/` — reusable components; `cards/` for card layouts, `widgets/` for small pieces
- `src/composables/` — shared composition functions (`useEntityView`, `useEafParser`, search logic, head/meta)
- `src/services/` — `api.ts` (fetch-based ApiService), `auth.ts` (OIDC via oidc-client-ts)
- `src/stores/` — Pinia stores (auth, i18n, splash) with localStorage persistence
- `src/router/` — Vue Router 5 with history mode, auth guards
- `src/configuration.ts` — Zod schema defining all configuration options

### Data flow

- `ApiService` is provided via Vue's `provide`/`inject` from `main.ts`
- API responses use RO-Crate format, parsed with the `ro-crate` library
- Many entity fields are `string | string[]` — use `first()` from `src/tools.ts` for safe single-value access
- `src/tools.ts` has utility functions for formatting (file sizes, durations), URL generation (`getEntityUrl`), and text manipulation

### Configuration

`/public/configuration.json` is loaded at startup and validated against the Zod schema in `src/configuration.ts`. It controls:

- UI branding, navigation, help text
- Search fields, sort options, faceted aggregations
- Metadata display (filter or explicit field lists)
- Map settings (bounding box, zoom, precision)
- Feature flags, analytics, Sentry DSN
- API endpoint URL and OAuth client config
