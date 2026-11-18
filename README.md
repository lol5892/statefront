# Statefront

Independent original territory strategy inspired by the mechanics of State.io. No original game code, logos, or graphic assets are included.

## Run

Node.js 20+ required. TypeScript 5.9.3 is downloaded from the npm registry into the ignored `package/` compiler directory. Run `node icons.mjs`, `node build.mjs`, `node --test tests/*.test.mjs`, and `node server.mjs`. The production game is in `dist/`, with no external runtime dependencies.

## Play

Drag from a blue state to a target. Drag through several blue states before releasing at a target to combine armies. Tap Select All then a destination to send all your states. The send percentage cycles 80%, 50%, 100%. Zoom allows panning by dragging the background. Friendly transfers reinforce the destination. Opposing dots cancel on collision; remaining troops reduce a garrison one for one, then capture the territory. Owned states produce troops; neutral states do not. Victory requires eliminating hostile territories and armies in flight. Defeat waits until the last player army is eliminated.

30 deterministic scenarios change starting states, troops, enemy count, and AI cadence. Three AI settings affect production, attack timing, targeting and defensive reinforcements. Saved games and campaign progress stay in localStorage on the current device. No server or account is required for play.

## iPhone

Open the HTTPS game in Safari, choose Share > Add to Home Screen. Load once online before playing offline. The service worker caches the entire production game. Clearing website data removes local progress. A physical iPhone was not available during development.

## Data

US geographic boundaries: PublicaMundi MappingAPI US states GeoJSON, https://github.com/PublicaMundi/MappingAPI/blob/master/data/geojson/us-states.json . Albers projection and Canvas rendering implemented in this project. Alaska, Hawaii, and DC are excluded: 48 contiguous states. Game reference research: https://www.youtube.com/watch?v=aJd6ZXap680 and https://mwm.ai/apps/state-io-conquer-the-world/1559032748 .
