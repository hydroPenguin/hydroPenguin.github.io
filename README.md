# Flight Sim

Browser flight simulation — runway, takeoff, fly, land — hosted on GitHub Pages.

**Live:** [hydropenguin.github.io](https://hydropenguin.github.io)

## Controls

| Key | Action |
|-----|--------|
| `W` / `S` | Throttle up / down |
| `↑` / `↓` | Pitch |
| `←` / `→` | Roll |
| `R` | Reset to runway |
| Any key | Dismiss start screen |

## Stack

- Vite + Three.js
- Rapier (WASM) rigid body + custom aero forces
- Deployed with `gh-pages`

## Local

```bash
npm install
npm run dev
```

## Deploy

```bash
npm run deploy
```
