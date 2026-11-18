# Statefront · New Fronts (v3)

Original mobile territory strategy. The v3 campaign replaces the full US map with 30 local, portrait battlefields inspired by six regional themes. Each operation has 6–10 large contiguous polygon sectors, independently generated silhouettes, positions and starting armies. No original State.io code, logos or assets are used.

## Run / build

Node.js 20+. The existing ignored `package/` directory contains the TypeScript 5.9.3 compiler downloaded from the official npm registry. `node build.mjs` compiles strict TypeScript and copies the PWA into `dist/`. `node --test tests/*.test.mjs` runs the tests. `node server.mjs` serves http://localhost:4173 . No external dependencies are loaded by the game.

## Play

Drag from blue to a destination. Swipe through several blue sectors to combine armies. Tap a blue sector, then tap a destination for an alternative to dragging. Dragging onto another friendly sector reinforces it. All Armies selects every blue sector. Sending cycles 75%, 50%, 100%. The camera is fixed and fits a local portrait board; no zoom or panning is needed. Army nodes are 44 CSS pixels, figures 21 pixels, touch targets 64 pixels, marching dots 6 pixels. The app accounts for safe areas.

Normal sectors generate 1.55 units/s, ⚡ hubs 2.8 units/s before AI difficulty modifiers. Neutral sectors do not generate troops. Garrisons cap at 160. Units cancel on contact and capture sectors one for one. Victory requires eliminating hostile sectors and armies in flight; defeat waits for the last player army.

## Campaign / opponents

Six regional themes repeat across five tiers, adding sectors and changing geometry, starting positions, forces and enemy count (1–4). Every fifth operation gives the enemy an extra foothold. Hubs create choices between fast expansion, production and defense. Three AI settings tune cadence, production, coordination and rescue behavior. Enemy personalities prioritize expansion, aggression or reserves. AI accounts for incoming armies and travel-time production, combines donors and rescues threatened sectors.

## Save / offline / updates

Existing unlocked levels and completions are preserved under `statefront-progress`. Old full-map battles restart on the corresponding local operation; incompatible 48-state snapshots are not loaded. V3 battles, armies and settings restore from localStorage. Progress is device-local. Safari Share > Add to Home Screen installs the PWA. Load once online to cache the complete game. V3 service worker replaces old Statefront caches while preserving unrelated apps' caches.

## Validation scope

Nine automated tests cover 30 unique maps, minimum node spacing, mobile-size coordinates, gestures, restart, version migration, resume, unlocks, battles, production hubs, coordinated/rescue AI and offline caching. 90 AI simulations (30 levels × 3 settings) verify active and valid battles. App-level tests use DOM/Canvas stubs; they are not a real Safari run. The browser tool's saved permission policy blocks localhost access. A physical iPhone is unavailable, so rendered appearance, Safari console and device frame rate remain unverified.
