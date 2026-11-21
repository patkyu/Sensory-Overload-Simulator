# Assets the app expects

Every placeholder can be swapped by **dropping in a file with the same path and name**. No code changes are needed.
To rename a file or change formats, edit the paths in `src/scenes/jeepney.config.ts` or `src/scenes/mall.config.ts`.

Budget, from the plan: keep **each scene at roughly 3–5 MB in total** (art plus audio), because most visitors are on mobile data.

## Scene art — `public/scenes/<scene>/`

All layers are stacked full-frame, back to front, on a **4:3 canvas** (the placeholders use an **800 × 600** viewBox).
Export every layer at the same size with a **transparent background** (except the back layer), so the layers line up.
Layers are drawn with `object-fit: cover`, so a slightly different aspect ratio is cropped rather than stretched.

- **Format:** SVG (preferred: tiny, sharp on every screen) or PNG/WebP. For a raster format, change the extension in the config.
- **Size target:** SVG under 50 KB per layer. PNG/WebP at 1600 × 1200, under 300 KB per layer.
- **No words in the art.** All text lives in `src/i18n/*.json`.
- **Faces simple or blank** (art direction notes).

### Jeepney — `public/scenes/jeepney/` (back → front)

| File | Layer | Notes | Placeholder |
|---|---|---|---|
| `background.svg` | Street through the windows | Must **tile horizontally** (left edge matches right edge): it scrolls for parallax. Opaque. | ✅ |
| `body.svg` | Jeepney interior | Windows must be **transparent holes** so the street shows through. Bobs gently. | ✅ |
| `passengers.svg` | Crowded passengers | Shown as the *Crowding* stressor rises. Knees/bags in the foreground. | ✅ |
| `passengers-calm.svg` | Calm passengers (fewer people) | Calm start and "all stressors off" state. *Optional, but the crowd swap needs it.* | ✅ |
| `signs.svg` | Hanging signs and rosary | Sways from the top (transform origin ~12% from the top). | ✅ |
| `glare.svg` | Sun glare | Mostly transparent; starts at opacity 0 and fades in with *Light*. This layer flickers. | ✅ |

### Mall — `public/scenes/mall/` (back → front)

| File | Layer | Notes | Placeholder |
|---|---|---|---|
| `shopfronts.svg` | Corridor and shopfronts | Opaque back layer. The pharmacy needs a recognisable symbol (task: "find the pharmacy"). | ✅ |
| `escalator.svg` | Escalator | Transparent background. | ✅ |
| `ceiling-lights.svg` | Fluorescent lights | Starts at 55% opacity; brightens and **flickers** with *Light*. | ✅ |
| `led-signs.svg` | LED signs | Gets brighter and more saturated with *Light*. | ✅ |
| `crowd.svg` | Crowd | Shown as *Crowding* rises. Sways. | ✅ |
| `crowd-calm.svg` | Calm crowd (a few people) | *Optional, but the crowd swap needs it.* | ✅ |

## Audio — `public/audio/<scene>/`

**No audio files ship yet.** When a file is missing or can't be decoded, the app **synthesizes a placeholder** in the browser (`src/audio/synth.ts`).
Drop in a real file and it is used automatically. In dev, run `__audio.placeholders` in the browser console to list which sounds are still synthesized.

- **Format:** `.mp3` (plays everywhere, including iOS Safari). AAC `.m4a` also works on all target browsers; change the extension in the config.
- **Mono**, 44.1 or 48 kHz, **96–128 kbps** (mono 96 kbps is about 0.7 MB per minute).
- **Loops must be seamless** (no silence or click at the start or end). Each loop starts at a random offset, so trim the leading silence.
- **Normalise to about −16 LUFS.** The mixer handles the levels, and the master has a hard cap and a limiter.
- **Captions:** every file has a caption key in the config. Update the caption text in `src/i18n/*.json` if the sound changes.

### Jeepney — `public/audio/jeepney/`

| File | Stressor | Type | Length | Caption key |
|---|---|---|---|---|
| `ambient.mp3` | — (ambient bed: light traffic + engine) | loop | 60–90 s per the plan (≤ 1 MB) | `cap.jeepney.ambient` |
| `horn.mp3` | Noise | loop | 10–20 s, a few honks with gaps | `cap.jeepney.horn` |
| `barker.mp3` | Noise | loop | 10–20 s ("Cubao! Sakay na!") | `cap.jeepney.barker` |
| `radio.mp3` | Noise | loop | 15–30 s | `cap.jeepney.radio` |
| `coins.mp3` | Social demands | loop | 5–10 s, sparse clinks | `cap.jeepney.coins` |
| `brake.mp3` *(optional, not in the plan's list)* | Sudden changes | one-shot | 1–2 s | `cap.jeepney.brake` |

### Mall — `public/audio/mall/`

| File | Stressor | Type | Length | Caption key |
|---|---|---|---|---|
| `ambient.mp3` | — (ambient bed: air-con hum) | loop | 60–90 s (≤ 1 MB) | `cap.mall.ambient` |
| `music.mp3` | Noise | loop | 20–40 s | `cap.mall.music` |
| `pa.mp3` | Noise | loop | 10–20 s (chime + announcement + gap) | `cap.mall.pa` |
| `chatter.mp3` | Noise | loop | 15–30 s | `cap.mall.chatter` |
| `alarm.mp3` | Sudden changes | one-shot | 2–3 s. Keep it **unpleasant but not piercing**. | `cap.mall.alarm` |

The mall's *Social demands* stressor (the salesperson) is **captions only** for now. To give it a voice, add `salesperson.mp3` and a `sounds` entry in `mall.config.ts`, and add `'salesperson'` to the social stressor's `sounds` list.

## Other images — `public/`

| File | Size | Notes |
|---|---|---|
| `og-image.png` | 1200 × 630 PNG | Link preview image. Currently generated from the placeholder jeepney art by the share-card renderer. Regenerate it once the real art is in. |

The per-visitor **share card** is drawn live on a canvas (`src/lib/shareCard.ts`, 1200 × 630) using each layer's calm art (it skips the glare), so it updates automatically with the real art.

## Licences and attribution

The plan says to use Freesound or Pixabay and keep an attribution list. Record every sound here before launch:

| File | Source URL | Author | Licence | Changes made |
|---|---|---|---|---|
| | | | | |
