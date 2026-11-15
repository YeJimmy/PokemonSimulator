# Tasks

Retroactive breakdown of the work, mapped to stories in `docs/user-stories.md`.
Checked items were done during the initial build; "Testing" items were done
in the retrofit pass.

## Setup
- [x] T-01 Initialize npm package (`package.json`)
- [x] T-02 Install and configure Electron (window, `npm.cmd start` script)

## Data layer (US-1, US-3, US-10)
- [x] T-03 `Pokemon` class with camelCase base stats and stat total
- [x] T-04 Whitespace-tolerant `PokemonData.txt` parser with header mapping
- [x] T-05 Sprite ID table + PokéAPI fallback lookup
- [x] T-06 Load data via Electron IPC (`main.js` + `preload.js`)

## Pokédex UI (US-1, US-2)
- [x] T-07 Render card grid with sprites
- [x] T-08 Detail pane: artwork with front-sprite fallback
- [x] T-09 Stat bars proportional to value, capped at 100%

## Team Builder UI (US-3, US-4)
- [x] T-10 Add/remove with 6-member cap and toggle semantics
- [x] T-11 Persist team in localStorage (load with corruption fallback)
- [x] T-12 Team slots UI + team-wide stat averages

## Battle engine (US-5..US-9)
- [x] T-13 `Combatant` (per-battle HP clone) and `Battle` state machine
- [x] T-14 Damage formula at level 100 (physical/special, variance, crit)
- [x] T-15 Turn order by priority, then Speed, then coin flip
- [x] T-16 Faint detection, automatic switch, win/loss detection
- [x] T-17 Enemy AI (stat-matchup weighted move choice)
- [x] T-18 Battle events → UI (HP bars, sprite animation, log)

## Battle UI (US-5, US-9)
- [x] T-19 Setup screen with team preview and empty-team guard
- [x] T-20 Arena rendering (front/back sprites, HP bars colored by %)
- [x] T-21 Move buttons, turn animation sequencing, result screen

## Testing (retrofit — TDD-flavored)
- [x] T-22 Make `src/data.js` and `src/battle.js` importable in Node (UMD guard, no behavior change for the browser)
- [x] T-23 Parser tests (row count, stat mapping, CRLF handling, totals)
- [x] T-24 Damage formula tests (mocked randomness: variance 1.0, crit, minimum 1)
- [x] T-25 Turn-order tests (priority, speed, tie-break with mocked random)
- [x] T-26 Faint/switch/win-loss flow tests (1v1 and 2v1 scenarios)
- [x] T-27 `npm test` script wiring (`node --test`)
- [x] T-28 Headless 20-battle simulation as an integration sanity check

## Verification
- [x] T-29 Syntax checks on all JS
- [x] T-30 App launched and smoke-tested (window opens, tabs render)

## Known limitations / future work
- [ ] T-31 Real per-Pokémon movesets (currently three generic moves for everyone)
- [ ] T-32 Type effectiveness chart
- [ ] T-33 Package as an installer (e.g. electron-builder)
- [ ] T-34 Automated UI/e2e tests (currently manual)
