# Oni UI

## Development

Current guide applies to Mac and Linux:

1. Copy `configuration.local.json` to `configuration.json` and modify as you wish
1. Create vocabs by running `pnpm run setup:vocabs vocab.json`
1. Start an API endpoint
   1. `docker compose up`
   1. Wait for API to be ready
1. Develop Portal:
   1. `cd src`
   1. `pnpm i`
   1. `pnpm run dev`
1. Open a browser to <http://localhost:5173>
