# MIRA-HUD

> ⚠ **This is the HUD only. The MIRA Humanoid is NOT part of this repo.**
> The particle-figure face of MIRA (assembly, states, voice-driven energy) lives in a separate
> repository with its own access. What you get here is the interface around her: the field,
> the ring, the light lines, the particle core and the status bar.

An animated **violet AI-agent HUD**, the interface of MIRA, the second voice of
[Apex](https://reznikov-engineering.com/apex), released open source.

Tap the orb to cycle her state (standby → listening → processing → speaking). A simulated voice
drives the ring, the lines, the field and the equalizer, the same way a real voice does.
While she is **listening**, your own microphone drives her (the browser asks first; nothing is
recorded or sent anywhere, and the mic turns off when she stops listening). If you say no, the
simulated voice is used.
Press **Design dial** (top right) to change every number of the look live with sliders.
The ring and status bar are **hand-written SVG / CSS**; the field is one fragment shader; the
particle core and the orbiting light lines are a small `react-three-fiber` scene (skipped under
`prefers-reduced-motion`); and the WebGL wave backdrop + the overview lamp panel are
**MIT community components from [21st.dev](https://21st.dev/community/components)**
(see [CREDITS](./CREDITS.md)).

> Built with Next.js 14 + React 18. Runtime deps: `lucide-react` (icons) and
> `three` / `@react-three/fiber` / `@react-three/postprocessing` (the 3D core and lines),
> all MIT-licensed.

## Live demo

**[mira-hud.vercel.app](https://mira-hud.vercel.app)** - the same code, running.
Tap the orb, then open the Design dial.

## Run it yourself

```bash
npm install
npm run dev
# open http://localhost:3000
```

Then `npm run build` for a production build, or deploy to Vercel in one click.

## What's inside

| Piece | What it does |
|-------|--------------|
| `MiraWorld` | Stacks every layer and owns the tap-state cycle and the simulated voice |
| `MiraField` | Her violet field: folded ridges, soft membranes and smoke (one fragment shader) |
| `MiraRing` | The gold ring frame (pure SVG) |
| `MiraCore3D` | The particle core, plus the far waves and the glow pass (`react-three-fiber` + bloom) |
| `MiraCoreMatter` | The thin light lines orbiting the ring, with smoke and star dust |
| `MiraStatusBar` | The equalizer + state label at the bottom |
| `MiraDial` | The Design dial panel: every number of the look as a slider, kept in the browser |
| `ShaderBackground` | Animated WebGL wave backdrop, tinted violet (MIT component from 21st.dev, see CREDITS) |
| `MiraOverviewPanel` | Top-left HUD: clock, the visitor's weather, "On this day", social links |
| `lib/miraStage` | Turns the look on/off and holds the per-frame values every layer reads |
| `lib/miraDial` | Every key number of the look in one table |
| `app/api/weather` | Keyless [open-meteo](https://open-meteo.com) proxy for the panel's weather |
| `app/api/onthisday` | One "on this day" event from Wikipedia's free public feed |

## Customise

- **The look, live** → press **Design dial**. 40 sliders in 9 groups (centre lines, smoke, star dust, ring and centre light, her voice, far waves, floating particles, background, glow). Moves are kept in your browser; double-click a slider to send it back; **HER STATE** switches her between standby, listening, processing and speaking while you tune.
- **Ship your own look** → press **COPY MY NUMBERS**, then put those values in the `def` column of `lib/miraDial.js`. **LOAD NUMBERS** pastes a set back in.
- **Social links** → edit `TILES` in `components/MiraOverviewPanel.tsx`.
- **Weather** → auto-detects the **visitor's** city on Vercel (geo headers); off Vercel it shows "your town".
- **A real voice** → call `setVoiceEnergy('output' | 'input', 0..1)` from `lib/voiceEnergy.js` every frame and set the state in `MiraWorld`.
- **Debug views** → add `?mira_debug=orb|mask|breakup|near|hot|nearhot|core|corehot` to the URL to see each layer alone.

## Accessibility

The orb is a real, focusable button with a spoken label, and the field and 3D layers are skipped
under `prefers-reduced-motion` (the ring and status bar remain).

## Not included (on purpose)

This repo is the **HUD only**. It does **not** include:

- **The MIRA Humanoid** - her particle-figure face is a separate product with its own access.
- **The voice call** - the production MIRA talks over a live speech connection; here a simulated
  voice level stands in, so the HUD stays fully animated without it.
- **The AI brain, accounts and keys** - this repo talks to nothing except its own two small
  routes (weather and "on this day").

## License

Code is released under the **[MIT License](./LICENSE)** - use it, fork it, ship it.

The **names "MIRA" and "Apex" and the Reznikov Engineering branding are not part of this license.**
If you build on this, please use your own product name and branding.

---

Made by [Ruben Mouradian, Reznikov Engineering](https://reznikov-engineering.com).
If you use it, a link back is appreciated (not required).
