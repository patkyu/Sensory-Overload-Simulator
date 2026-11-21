# Sensory Overload Simulator — prototype

A mobile-first, static web experience. Visitors ride a jeepney or walk through a mall while sensory stressors build up, then switch each one off and see the real-life accommodation that helps. There is no backend, no login and no personal data.

**Status:** working prototype with **placeholder art and synthesized placeholder sounds**. The copy that portrays autism is deliberately left as TODO placeholders for the autistic advisors (see the checklist below).

## Run, build, deploy

Requires Node 18+.

```bash
npm install
```

```bash
npm run dev
```

Open http://localhost:5173. Add **`?speed=10`** to the URL to run the scene timings 10× faster while testing (for example `http://localhost:5173/?speed=10`).

```bash
npm run build
```

```bash
npm run preview
```

```bash
npm test
```

```bash
node scripts/check-i18n.mjs
```

- `npm run build` outputs a static site in `dist/`.
- `npm run preview` serves `dist/` locally.
- `npm test` runs the unit tests (the flicker rate limiter).
- `node scripts/check-i18n.mjs` checks that every string key exists in both `en` and `tl`, and lists the TODOs.

### Deploy (all free tiers)

The output is a plain static folder, and there are no client-side routes, so no rewrite rules are needed.

- **Vercel:** import the repo. Framework preset *Vite*, build `npm run build`, output `dist`.
- **Netlify:** build command `npm run build`, publish directory `dist`.
- **Cloudflare Pages:** framework preset *Vite*, build `npm run build`, output `dist`.

Set **`VITE_SITE_URL`** (for example `https://sapananawnila.ph`) in the host's environment variables. It is the link printed on the share card and copied by "Copy link". If it isn't set, the current origin is used.

## How it's built

```
src/
  scenes/types.ts            Scene data model (stressors, layers, sounds, effects, timings)
  scenes/jeepney.config.ts   ← tune the jeepney scene here
  scenes/mall.config.ts      ← tune the mall scene here (lazy-loaded)
  scenes/index.ts            Lazy loader: each scene config is its own chunk
  audio/engine.ts            Web Audio mixer: one GainNode per stressor, hard master cap, limiter, fades
  audio/synth.ts             Synthesized placeholder sounds (used when an .mp3 is missing)
  effects/flicker.ts         Photosensitivity guard: shared flash rate limiter (+ flicker.test.ts)
  components/SceneView.tsx   Layered SVG scene, CSS transitions, flicker, shake, idle motion
  components/…               Captions, Task, TogglePanel, StopButton, Header, UI primitives
  screens/                   ComfortCheck → PickScene → SceneRunner (steps 3–6) → BreakScreen / Reflection → ShareScreen
  i18n/en.json, tl.json      ALL user-facing text (no text in components or art)
  lib/analytics.ts           track(event) stub, ready for Plausible or Umami
  lib/shareCard.ts           Canvas 1200×630 PNG + Web Share API + download fallback
public/scenes/…, public/audio/…   Swap-in assets (see ASSETS.md)
```

### The flow (the plan's 8 steps)

1. **Comfort check:** flashing-light and headphones warnings, gentle mode, language. **Start** unlocks audio.
2. **Pick a scene:** jeepney or mall.
3. **Calm start:** `timings.calmMs` (10 s). Ambient sound only, calm art.
4. **Build-up:** `timings.buildupMs` (75 s). Each stressor starts at its `startAtMs` and rises over `rampMs`, while the visitor does the task (count the change / find the pharmacy).
5. **Peak:** `timings.peakMs` (10 s). Everything at full.
6. **Toggle phase:** one switch per stressor. Switching one off fades it out over `fadeOutMs` (1.5 s), reveals the accommodation, and it **never comes back on**.
7. **Reflection:** includes a text-only version and the optional anonymous question.
8. **Share card.**

**Stop / I need a break** (or **Esc**) is visible throughout steps 3–6. It fades sound and picture out in 800 ms and opens a quiet break screen.

### Tuning a scene

Everything is in the scene's config file:
- **timings:** calm, build-up, peak and fade lengths
- **stressor order:** `startAtMs`, `rampMs`, `peakGain`
- **sounds:** which sounds belong to which stressor
- **visual effects:** `layer` looks, `crowdSwap`, `scene` colour shift, `flicker`, recurring `event`s with optional shake
- **text cues:** smell, touch and speech
- **the task**

Every text key points into `src/i18n/*.json`.

### Audio wiring

```
source → soundGain → stressorGain (×6) ─┐
ambient → ambientGain ──────────────────┴→ bus → limiter → fade (start/stop envelope) → cap (hard volume cap) → speakers
```

- **Starts low:** the fade stage ramps 0 → 1 over 4 s.
- **Hard cap:** `MASTER_CAP = 0.5`, or `GENTLE_CAP = 0.28` in gentle mode. The cap stage clamps to these whatever a caller asks for.
- **Fades:** every change is a linear ramp, with no hard cuts.
- **iOS Safari:** the AudioContext is created and resumed, and a silent buffer is played, synchronously inside the Start tap (repeated on the scene tap).
- **Hidden tab:** audio suspends when the tab is hidden.

## Safety and accessibility: what's enforced and where

| Rule | Where |
|---|---|
| ≤ 3 flashes per second (WCAG 2.3.1) | `effects/flicker.ts`. Every flicker goes through one shared `FlickerLimiter`: **max 2 flashes in any 1-s window**, min 500 ms gap, dip depth clamped to 35%. Config values are clamped in code. Unit-tested; also checked in the browser (measured max = 2/s). |
| Photosensitivity + headphones warning first | `screens/ComfortCheck.tsx` |
| Stop always visible, silence within 1 s | `components/StopButton.tsx` (fixed bottom bar) + `SceneRunner` `stop()`. Sound and picture fade in 800 ms. Esc works too. |
| Gentle mode | No flicker (limiter disabled), no shake, no idle motion, visuals at 45% strength, stressors at 50% volume, lower master cap. **Auto-on with `prefers-reduced-motion`**, plus a CSS backstop. Toggle on the comfort screen and in the header. |
| Audio starts low, hard cap | `audio/engine.ts` |
| Captions for every sound; smell/touch as text | `components/Captions.tsx` (live region). Each sound has a `captionKey`; smell, touch and speech are `cues`. |
| Keyboard, tap targets, contrast | All controls are native buttons; switches use `role="switch"`. Tap targets ≥ 48 px. Visible focus ring. Focus moves to each screen's heading. Text colours ≥ 4.5:1. |
| Text-only reflection | "Text-only version" button on the reflection screen |
| No personal data | No cookies or IDs. `sessionStorage` holds only language + gentle mode. `track()` sends fixed event names and non-identifying values. |

## Swapping in real assets

1. Drop files into `public/scenes/<scene>/` and `public/audio/<scene>/` with the names listed in **[ASSETS.md](ASSETS.md)**.
2. Run `npm run dev`. Check that real files load: in the browser console, `__audio.placeholders` lists any sounds still synthesized.
3. Update the captions in `src/i18n/en.json` and `tl.json` if a sound changes.
4. Regenerate `public/og-image.png` (1200 × 630) from the real art.
5. Check the per-scene budget (about 3–5 MB) with `du -sh dist/scenes/* dist/audio/*` after `npm run build`.

## Wiring analytics

`src/lib/analytics.ts` → `track(event, props)` is a no-op (logged in dev). Add the Plausible or Umami script tag to `index.html`, then call `window.plausible?.(event, { props })` or `window.umami?.track(event, props)` inside `track`.

Events: `comfort_start`, `scene_start`, `phase`, `task_answer`, `toggle_off`, `stop_pressed`, `reflection_reached` (completion rate), `reflection_answer` (yes/little/no), `share`, `share_download`.

## Checklist: still placeholder or TODO

**Needs autistic advisors (don't fill these in without them):**
- [ ] `reflection.quote` / `reflection.quoteBy`: quote or captioned clip from an autistic Filipino (consent, credit, payment)
- [ ] `reflection.do1–3`: "3 things anyone can do"
- [ ] `reflection.different`: the under-sensitive / soothing-input card
- [ ] `break.tooMuch`: the "if this felt like too much" note on the break screen
- [ ] Confirm identity-first language ("autistic person") throughout
- [ ] Review the whole script, including the scene captions, cues and the task framing, at the plan's advisor gates
- [ ] Confirm the wording of the optional question "Did this change how you see meltdowns?" (taken from the plan)

**Language:**
- [ ] All of `tl.json` is a **draft Taglish translation by Claude**. It needs native-speaker review.
- [ ] `common.oneExample` (TL) is marked TODO: the plan gives only the English sentence.

**Assets:**
- [ ] Real layered art for both scenes (currently flat-shape placeholders)
- [ ] All 10 sound files (currently synthesized in the browser), plus an optional `brake.mp3` and `salesperson.mp3`
- [ ] Attribution list in ASSETS.md
- [ ] `og-image.png` from the real art
- [ ] Final working title (`app.title`, `<title>` and OG tags in `index.html`)

**Not built yet / later:**
- [ ] Wire `track()` to Plausible or Umami
- [ ] Optional feedback storage (Supabase or a Google Form). The plan lists it as optional; right now the answer only goes to `track()`.
- [ ] **Test on a real iPhone (iOS Safari) early**, as the plan says. Note: with the ring/silent switch on, iOS mutes Web Audio; captions still work.
- [ ] Two art sizes for slow connections (plan risk list)
- [ ] Real-device performance check on a low-end Android phone
