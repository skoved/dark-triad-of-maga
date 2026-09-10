# AGENTS.md

Orientation for coding agents working on this repo. Human quickstart is in
`README.md`; image licensing is in `ATTRIBUTIONS.md`.

## What this is

**The Dark Triad of MAGA** — a single-page browser game (political satire). The
player is shown Trump-era officials and Republican figures one at a time and
clicks a point inside a triangle to "place" each of them. The triangle's corners
are the dark-triad personality traits: **Narcissism** (top), **Machiavellianism**
(bottom-left), **Psychopathy** (bottom-right). Moving the cursor shows the live
trait mix at that point; clicking locks it in and advances. Placed people become
small photo markers; hovering a marker extends a "hockey-stick" callout with that
person's photo/name/position. After everyone is placed you get a summary board, a
ranked list, a **Download image** (PNG) button, and **Start over**.

No backend, no accounts, no analytics. Progress lives in `localStorage`. The
build output is fully static.

## Stack & commands

- **Vite 6** + **React 18** + **TypeScript** (strict) + **Tailwind CSS v4** (via
  `@tailwindcss/vite`).
- Libs: `zod` (roster validation), `html-to-image` (PNG export),
  `@modyfi/vite-plugin-yaml` (build-time YAML import). Tests: **Vitest** + jsdom.
- Node **22** (`.nvmrc`).

```
npm install
npm run dev         # Vite dev server (default http://localhost:5173)
npm run build       # tsc -b && vite build  ->  dist/
npm run preview      # serve the production build
npm run test         # vitest run  (26 tests)
npm run test:watch
```

## Repo layout

```
index.html               # root div + Google Fonts (Archivo Black, Inter) + favicon
vite.config.ts           # plugins: react, tailwindcss, yaml; vitest config
tsconfig.json            # references tsconfig.app.json (src) + tsconfig.node.json
vercel.json              # static deploy config (see Deploy)
.nvmrc                   # 22
scripts/fetch-portraits.mjs   # downloads missing roster portraits
public/officials/<id>.jpg     # bundled portraits (~480px, ~20-45 KB each)
src/
  main.tsx               # createRoot(<StrictMode><App/></StrictMode>) + index.css
  App.tsx                # phase router
  index.css              # Tailwind import + @theme tokens + base/utility/anim layers
  data/
    officials.yaml       # THE ROSTER - single source of truth (currently ~39 entries)
    officials.ts         # imports the YAML, zod-validates, exports OFFICIALS etc.
  hooks/
    useGameState.ts      # reducer + persistence hook (exports `reducer` for tests)
  lib/
    barycentric.ts       # triangle geometry (viewBox 0..100)
    hockeyStick.ts        # callout geometry helper
    storage.ts            # localStorage load/save/validate
  components/
    TitleScreen.tsx  PlayScreen.tsx  SummaryBoard.tsx
    TriangleBoard.tsx     # the SVG board (largest file, ~530 lines)
    PersonPrompt.tsx  TraitReadout.tsx  CalloutCard.tsx  ExportPngButton.tsx
  *.test.tsx / lib/*.test.ts / hooks/*.test.ts
```

## How the code works

### Phase routing — `App.tsx`

`useGameState()` returns `phase`. `App` renders `TitleScreen` for `title`,
`SummaryBoard` for `summary`, otherwise `PlayScreen` (also falls back to
`SummaryBoard` defensively if `currentOfficial` is null).

### Game state — `hooks/useGameState.ts` + `lib/storage.ts`

- `useReducer(reducer, undefined, init)` where `init = loadState() ?? freshState()`.
- Actions: **`newGame`** (Fisher-Yates shuffle of roster ids, `phase = playing`,
  clear placements), **`place(bary)`** (append a `Placement`, advance
  `currentIndex`, flip to `summary` when it reaches the roster length),
  **`reset`** (back to a fresh `title` state).
- An effect persists every state via `saveState` — except the fresh empty `title`
  state, which calls `clearState`.
- The hook exposes `phase`, `total`, `currentIndex`, `currentOfficial`, `placed`
  (`PlacedOfficial[] = { official, bary, order }`), and `newGame` / `place` /
  `reset`.
- `storage.ts`: key **`dtom:v1`**.
  `GameState = { version: 1, phase: 'title'|'playing'|'summary', order: string[],
  currentIndex: number, placements: Placement[] }`;
  `Placement = { id, n, m, p }` — barycentric weights in `[0,1]` that sum to 1.
  `loadState()` hard-validates (version, phase enum, `order` exactly matches the
  current roster's ids and length, finite weights) and returns `null` on any
  mismatch — so changing the roster safely discards an incompatible save.

### Geometry — `lib/barycentric.ts`

The board is an SVG `viewBox="0 0 100 100"`. Corners: `A` = Narcissism `(50,10)`,
`B` = Machiavellianism `(10,87)`, `C` = Psychopathy `(90,87)`.
Key exports: `toBarycentric` / `fromBarycentric`, `isInside`, `clampToTriangle`,
`normalizeBary`, `CENTROID`, `dominantTrait`, `toPercents` (largest-remainder
rounding so the three integers always sum to 100), `TRAIT_LABEL`,
`TRAIT_DEFINITION`, `Bary = {n,m,p}`, `Trait = 'n'|'m'|'p'`.
**Placements are stored as barycentric weights, never pixels** — they stay correct
at any board size.

### The board — `components/TriangleBoard.tsx`

One SVG, layered bottom to top:

1. base-fill polygon (dark radial-ish gradient)
2. faint **MAGA yard-sign** backdrop (`MagaSign`, `opacity: 0.18`, clipped to the
   triangle)
3. barycentric grid lines
4. glowing crimson edge polygon
5. **photo markers** — `<image>` clipped to a circle, `filter: saturate(0.55)`,
   a ring that pulses on the most recent placement, a `data-marker` attribute,
   and an invisible larger hit-circle for hover/click
6. **hockey-stick callout** — a `useLayoutEffect` computes `calloutLayout`
   (card position + polyline points + end dot). The card starts beside the marker
   and **dodges** the flanking panels: if it would overlap the element in
   `avoidLeftRef` / `avoidRightRef`, it slides fully above/below that panel and
   the line is redrawn to still connect.
7. ghost / pending marker (cursor preview; touch flow uses a "Place here" button)
8. `CornerLabel` trait names at the three vertices

Props: `placed`, `interactive`, `showAllNames`, `avoidLeftRef`, `avoidRightRef`,
`onHoverBary`, `onPlace`. The component `forwardRef`s its root `<div>` so
`ExportPngButton` can rasterize it.

**Gotcha:** SVG presentation attributes do not resolve CSS custom properties, so
colors here are hard-coded hex in a local `COLOR` map (this also makes the PNG
export match the on-screen render).

### Screens

- **`PlayScreen`** — fixed-height flex column (`lg:h-dvh lg:overflow-hidden`, so
  it never scrolls on desktop). Center: a vertical stack of {Narcissism
  definition, the board, a two-column {Machiavellianism, Psychopathy} definition
  row}. Flanked by `PersonPrompt` (left) and `TraitReadout` (right); their
  wrapper `<div>` refs are passed to `TriangleBoard` for callout dodging. Board
  sized `lg:w-[min(44vw,calc(100dvh-15rem))]` (the `15rem` reserve is the knob
  for triangle-size vs. margin).
- **`SummaryBoard`** — big triangle with `showAllNames` + `ExportPngButton` +
  "Start over", beside a scrollable `<ul>` sorted by dominant trait (photo, name,
  position, mini N/M/P bar, dominant-trait label).
- **`TitleScreen`** — hero title + description + "Enter" (calls `newGame`).
- **`PersonPrompt`** — "Place this person", a `N / total` counter (kept on one
  line), photo + name/position (wraps below the photo when the card is narrow),
  progress bar.
- **`TraitReadout`** — "Trait mix": three rows (N/M/P) with animated bars; live
  percentages on hover, blank otherwise.
- **`CalloutCard`** — small photo/name/position card at the end of the hockey
  stick.
- **`ExportPngButton`** — `html-to-image` `toPng` on the board ref → downloads
  `dark-triad-of-maga.png`.

## Roster & portraits

`src/data/officials.yaml` is the **single source of truth**. It is imported at
build time by `@modyfi/vite-plugin-yaml`; `src/data/officials.ts` then
`zod`-validates every entry and **throws on a malformed or duplicate `id`**,
exporting `OFFICIALS`, `OFFICIALS_BY_ID`, and `photoUrl(photo)`.

Entry schema:

```yaml
- id: jd-vance                 # kebab-case, unique; also the photo filename
  name: J.D. Vance
  position: Vice President of the United States
  photo: officials/jd-vance.jpg # resolved under /public
  source: https://commons.wikimedia.org/wiki/File:...   # optional, attribution only
  license: Public domain (U.S. Government work)          # optional, not shown in-game
  dggCanvass:                    # optional; presence renders the canvass badge
    eventName: Canvass to defeat ...
    signupUrl: https://www.mobilize.us/...   # validated as a URL
```

`dggCanvass` (validated by `DggCanvassSchema` in `officials.ts`) renders a
megaphone + `eventName` via `components/CanvassBadge.tsx` — a signup **link** on
`PersonPrompt`, plain text on `CalloutCard` (the callout is `pointer-events-none`).

Portraits go in `public/officials/<id>.jpg`. `scripts/fetch-portraits.mjs` reads
the YAML and downloads any missing portrait — English-Wikipedia lead image by
name, then the Commons `File:` in `source:`, then an SVG placeholder as a last
resort. It is throttled with retry/backoff; `--force` refetches everything. New
images should be normalized to match the rest:
`magick mogrify -resize '480x480>' -strip -quality 82 public/officials/<id>.jpg`.

**Roster size is dynamic everywhere** (the counter, the tests). Adding or removing
people needs no code change — edit the YAML, run the portrait script, and verify
photos for common names resolved to the right person.

## Styling — `src/index.css`

Tailwind v4: `@import 'tailwindcss'` + an `@theme` block of design tokens —
surfaces `void`/`pit`/`surface`/`raised`, text `bone`/`ash`/`faint`, accent
`blood`, trait tints `narc`/`mach`/`psych`, fonts `sans` = Inter and
`display` = Archivo Black (loaded via `index.html`). Base layer: near-black
background, fixed grain + vignette pseudo-elements, `overflow-x: hidden`, and a
responsive root `font-size: clamp(17px, …, 21px)` that scales the whole UI.
Utilities `text-glow` / `ring-glow`; keyframe animations `dtom-draw` (callout
line, relies on the polyline's `pathLength={1}`), `dtom-pulse`, `dtom-spin` — all
disabled under `prefers-reduced-motion`.

**Dark theme only. Design target is ≥ 1920×1080.** Smaller widths only need to not
break (layout stacks below the `lg` breakpoint; scrolling is acceptable there).

## Tests — `npm run test` (Vitest, 5 files / 26 tests)

Config lives in `vite.config.ts` (`test.environment: 'node'`; files that need a
DOM use a `// @vitest-environment jsdom` pragma).

- **`src/lib/barycentric.test.ts`** (8) — vertex/centroid mapping, weights sum to
  1, `fromBarycentric ∘ toBarycentric` round-trip, `clampToTriangle`,
  `dominantTrait`, `toPercents` sums to 100.
- **`src/lib/hockeyStick.test.ts`** (4) — `buildCallout` side selection, `end.x`
  clamped to `[4,96]`, elbow farther from centroid than the marker, 3-point
  polyline.
- **`src/lib/storage.test.ts`** (7) — round-trip, `clearState`, rejects wrong
  `version` / roster mismatch / malformed placements / non-JSON. Shims
  `localStorage` via `vi.stubGlobal`.
- **`src/hooks/gameReducer.test.ts`** (5) — `reducer`: `newGame` shuffles +
  resets, `place` advances, flips to `summary` on the final placement, ignores
  `place` when not `playing`, `reset` → `title`.
- **`src/App.test.tsx`** (2, jsdom) — full play-through (title → place every
  official → summary → "Start over" clears storage) and resume from
  `localStorage`. Stubs `Element.prototype.getBoundingClientRect` to a fixed
  500×500 box; `placeAt(i)` clicks a 6-column interior grid so it scales with the
  roster. Counts markers with `document.querySelectorAll('[data-marker]')` and
  the counter with `` `N / ${OFFICIALS.length}` ``.

If you change marker markup, keep the `data-marker` attribute. If you change the
counter text or roster size, the App test already derives from `OFFICIALS.length`.

## Build

`npm run build` = `tsc -b` then `vite build`.

- `tsc -b` uses project references: **`tsconfig.app.json`** for `src/` (strict,
  `noUnusedLocals` / `noUnusedParameters`, extra `types` for the YAML plugin and
  `vitest/globals`) and **`tsconfig.node.json`** for `vite.config.ts`.
- `vite build` emits a static bundle to **`dist/`** — `index.html`, hashed
  JS/CSS in `dist/assets/`, and `dist/officials/` copied from `public/`.
- Tailwind compiles through `@tailwindcss/vite`; YAML through
  `@modyfi/vite-plugin-yaml`. No environment variables.
- `npm run preview` serves `dist/` locally.

## Deploy

Static hosting on **Vercel**. `vercel.json`: `framework: vite`,
`buildCommand: npm run build`, `outputDirectory: dist`, and a SPA rewrite
`/(.*)` → `/index.html`. `.nvmrc` pins Node 22. Deploy by pushing to the
connected git repo, or run `npx vercel` / `vercel --prod` locally. There is no
server and there are no secrets. See `README.md` for step-by-step instructions.

## Gotchas

- **SVG attributes need literal colors**, not CSS vars — use `TriangleBoard`'s
  `COLOR` map.
- **Placements/markers are barycentric weights**, never pixels.
- **Bump the `dtom:v1` localStorage key** if you change the `GameState` shape
  (otherwise stale saves are silently rejected, which is usually fine but worth
  knowing).
- After editing `officials.yaml`, run `scripts/fetch-portraits.mjs` and
  eyeball the new photos (common names can resolve to the wrong person).
- Keep this file **≤ 300 lines**.
