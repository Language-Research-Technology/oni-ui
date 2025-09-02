# Oni UI

## How to Run

Current guide applies to Mac and Linux:

1. Verify your docker-compose.yml points to the right ocfl repository
   1. Currently, using **Oni** version **2.1.0**
1. Copy `configuration.local.json` to `configuration.json` and modify as you wish
1. Create vocabs by running `pnpm run setup:vocabs vocab.json`
1. Start an Oni
   1. `docker compose up`
   1. Wait for oni to be ready
1. Develop Portal:
   1. `cd portal`
   1. `pnpm i`
   1. `pnpm run dev`
1. Open a browser to <http://localhost:8000> : This will use nginx features to use the site without nginx features point to <http://localhost:11000>
