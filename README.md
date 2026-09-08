# The Dark Triad of MAGA

A browser game: figures from the Trump administration and Republican politics are
presented one at a time, and you drop each of them onto a triangle whose corners
are the three **dark triad** traits — **Narcissism** (top),
**Machiavellianism** (bottom-left), and **Psychopathy** (bottom-right).

- Move the cursor over the triangle to read the live trait mix at that spot.
- Click to lock a placement; the next figure appears.
- Placed figures become markers. Hover a marker and a hockey-stick callout
  extends out of the triangle with that person's photo, name, and position.
- After everyone is placed you get a summary board, a ranked list, a
  **Download image** button (PNG), and **Start over**.
- Progress is saved to `localStorage` in the current browser only.

## Stack

Vite + React + TypeScript, Tailwind CSS v4. No backend — fully static.

## Develop

```bash
npm install
npm run dev        # http://localhost:5173
npm run test       # geometry unit tests (Vitest)
npm run build      # type-check + production build to dist/
npm run preview    # serve the production build locally
```

## Editing the roster

`src/data/officials.yaml` is the list of people. Each entry:

```yaml
- id: jane-doe
  name: Jane Doe
  position: U.S. Secretary of Something
  photo: officials/jane-doe.jpg      # -> public/officials/jane-doe.jpg
  source: https://commons.wikimedia.org/wiki/File:...
  license: Public domain (U.S. Government work)
```

Add the matching image to `public/officials/`. The YAML is validated at startup
(`src/data/officials.ts`); a bad entry throws with details in the console.

Portrait sourcing / licensing notes are in [`ATTRIBUTIONS.md`](./ATTRIBUTIONS.md).

## Deploy to Vercel (free tier)

Everything is static, so it fits the Hobby plan with no configuration beyond the
included `vercel.json`.

**Option A — CLI**

```bash
npm i -g vercel     # or use: npx vercel
vercel              # first run links/creates the project
vercel --prod       # promote to production
```

**Option B — Git integration**

1. Push this repo to GitHub/GitLab/Bitbucket.
2. In the Vercel dashboard: **Add New… → Project**, import the repo.
3. Framework preset auto-detects **Vite** (build `npm run build`, output `dist`).
4. Deploy. Every push to the default branch redeploys production; other branches
   get preview URLs.
