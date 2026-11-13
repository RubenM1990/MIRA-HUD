# MIRA-UI

The **HUD of MIRA**, the second voice of [Apex](https://reznikov-engineering.com/apex), released
open source: a violet AI-agent interface with a living field, thin light lines orbiting the ring
on wandering paths, star dust, and a particle core.

Tap the orb to change her state (standby → listening → processing → speaking). A simulated voice
drives the ring, the lines, the field and the equalizer, the same way a real voice does.

> ⚠ **The MIRA Humanoid is NOT part of this repo.** Her particle-figure face lives in a separate
> repository with its own access. What you see here is the HUD only.

> Built with Next.js 14 + React 18. Runtime deps: `three`, `@react-three/fiber`,
> `@react-three/postprocessing` (the 3D core and lines) and `lucide-react` (icons), all MIT.

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
| `ShaderBackground` | Animated WebGL wave backdrop, tinted violet (MIT component from 21st.dev, see CREDITS) |
| `MiraOverviewPanel` | Top-left HUD: clock, the visitor's weather, "On this day", social links |
| `lib/miraStage` | Turns the look on/off and holds the per-frame values every layer reads |
| `lib/miraDial` | Every key number of the look in one table |
| `app/api/weather` | Keyless [open-meteo](https://open-meteo.com) proxy for the panel's weather |
| `app/api/onthisday` | One "on this day" event from Wikipedia's free public feed |

## Customise

- **The look** → change the `def` numbers in `lib/miraDial.js` (line count, glow, smoke, dust, ring size, far waves, bloom).
- **Social links** → edit `TILES` in `components/MiraOverviewPanel.tsx`.
- **Weather** → auto-detects the visitor's city on Vercel; off Vercel it shows "your town".
- **A real voice** → call `setVoiceEnergy('output' | 'input', 0..1)` from `lib/voiceEnergy.js` every frame and set the state in `MiraWorld`.
- **Debug views** → add `?mira_debug=orb|mask|breakup|near|hot|nearhot|core|corehot` to the URL to see each layer alone.

## Accessibility

The orb is a real, focusable button with a spoken label, and the field and 3D layers are skipped
under `prefers-reduced-motion` (the ring and status bar remain).

## Not included (on purpose)

This repo is the **UI only**: no voice call, no AI brain, no accounts and no keys. It talks to
nothing except its own two small routes (weather and "on this day").

## License

Code is released under the **[MIT License](./LICENSE)**.

The **names "MIRA" and "Apex" and the Reznikov Engineering branding are not part of this license.**
If you build on this, please use your own product name and branding.

---

Made by [Ruben Mouradian, Reznikov Engineering](https://reznikov-engineering.com).
If you use it, a link back is appreciated (not required).
