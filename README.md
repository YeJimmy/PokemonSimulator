# PokemonSimulator

[![CI](https://github.com/YeJimmy/PokemonSimulator/actions/workflows/ci.yml/badge.svg)](https://github.com/YeJimmy/PokemonSimulator/actions/workflows/ci.yml)

A desktop Pokémon battle simulator built with [Electron](https://www.electronjs.org/).
Browse the Pokédex, build a team, and battle a random enemy team, all powered by
the stats in `PokemonData.txt` and sprites from the [PokéAPI](https://pokeapi.co/) sprite CDN.

## Features

- **Pokédex**: grid of every Pokémon in `PokemonData.txt` (the full Generation 1-3 roster, 386 entries, generated from PokéAPI); click one to see its
  official artwork and base-stat bars.
- **Team Builder**: add/remove up to 6 Pokémon; the team is saved between runs
  (stored in `localStorage`) and shows team-wide stat averages.
- **Battle**: turn-based battles at level 100. Damage uses the classic formula
  with Attack/Defense (physical moves) or Special Attack/Special Defense
  (special moves), turn order is decided by priority then Speed, and there's a
  1/16 critical-hit chance. Win by fainting the whole enemy team.

## Running it

```powershell
npm.cmd install   # first time only (already done if node_modules exists)
npm.cmd start
```

## CI

Every pull request (and every push to `main`) runs the test suite on GitHub
Actions, on Node 20, 22 and 24 (`.github/workflows/ci.yml`). The Electron
binary download is skipped since tests never launch the GUI. A green check
on your PR means all tests pass.

## Testing

```powershell
npm.cmd test
```

Uses the built-in Node test runner (`node --test`, no extra dependencies).
`src/battle.js`, `src/data.js` and `src/team.js` are also importable in Node via a
UMD-style guard, so the engine, parser and team rules can be tested without a
browser. See `test/battle.test.js`, `test/data.test.js` and `test/team.test.js`.

## Tracking work

User stories and tasks live as GitHub Issues:
[github.com/YeJimmy/PokemonSimulator/issues](https://github.com/YeJimmy/PokemonSimulator/issues)
(labels `user-story` / `task`). Status is tracked on the project board:
[PokemonSimulator board](https://github.com/users/YeJimmy/projects/1).

> Note: on this machine `npm` in PowerShell is blocked by the execution policy,
> so use `npm.cmd` instead.

## Project layout

```
main.js           Electron main process: creates the window, reads PokemonData.txt
preload.js        Safe bridge exposing window.pokemonApi.loadPokemonData()
PokemonData.txt   The data source: Name HP Attack Defense SpecialAttack SpecialDefense Speed
Pokemon.js        Original starter file (kept for reference, not used by the app)
src/
  index.html      The single page with all three tabs
  styles.css      All styling
  data.js         Pokemon class, PokemonData.txt parser, PokéAPI sprite lookup
  battle.js       Battle engine (damage formula, turn order, enemy AI). No DOM code
  team.js         Team membership rules (max 6, species-unique). No DOM code
  app.js          UI logic: tabs, rendering, battle animation
test/             node:test suites (run via npm test)
```

## Regenerating the roster

`PokemonData.txt` was generated from the PokéAPI with
`node scripts/generate-pokemon-data.js`. It fetches base stats for IDs 1-386,
computes level-100 max-IV/max-EV neutral stats (HP = 2×base+204,
others = 2×base+99), verifies the original four Pokémon are unchanged, and
rewrites the file plus `src/spriteIds.generated.js`. Re-run it to refresh;
don't hand-edit the generated files.

## Adding more Pokémon

Add a line to `PokemonData.txt` with the same columns, e.g.:

```
Eevee 325 185 229 231 231 235
```

The app picks it up automatically on next launch. If the name isn't one of the
four hard-coded sprite IDs in `src/data.js`, its sprite ID is looked up live
from the PokéAPI by name.

## Sprites

Sprites and artwork are loaded from the PokéAPI GitHub sprite repository at
runtime, so an internet connection is required for images to appear.
