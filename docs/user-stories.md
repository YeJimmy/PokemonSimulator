# User Stories

Format: **As a** [role] **I want** [capability] **so that** [benefit].
Each story has acceptance criteria (AC) written as testable statements.
These were captured retroactively to document the app's behavior; the
automated checks live in `test/` and run with `npm test`.

## Pokédex

### US-1 — Browse the Pokédex
**As a** trainer **I want** to see every Pokémon in PokemonData.txt in a grid
**so that** I can quickly see what's available.

- AC1. Every non-empty data row in PokemonData.txt produces exactly one card.
- AC2. Each card shows the Pokémon's sprite and name.
- AC3. Cards that fail to load a sprite do not break the grid.

### US-2 — View Pokémon details
**As a** trainer **I want** to click a Pokémon and see its stats
**so that** I can compare it before adding it to my team.

- AC1. Selecting a card shows official artwork (falling back to the front sprite if artwork fails).
- AC2. All six base stats are rendered with the numeric value and a bar.
- AC3. The base stat total is shown.
- AC4. A stat bar's width is proportional to the value (capped at 100%).

## Team Builder

### US-3 — Build a team
**As a** trainer **I want** to add and remove Pokémon from my team
**so that** I can pick who fights.

- AC1. Adding a Pokémon appends it to the team and marks it as in the team.
- AC2. Removing a Pokémon takes it out of the team.
- AC3. Toggling is idempotent: adding twice does not duplicate.
- AC4. A team may hold at most 6 Pokémon; extra "Add" attempts are ignored.

### US-4 — Persist my team
**As a** trainer **I want** my team saved between app runs
**so that** I don't rebuild it every time.

- AC1. Saving writes the team to localStorage under a known key.
- AC2. Loading restores the team; corrupt storage falls back to an empty team.

## Battle

### US-5 — Start a battle from my team
**As a** trainer **I want** to battle with my saved team against a random enemy team
**so that** I can test my picks.

- AC1. The battle uses the player's saved team (cloned — the Pokédex copy is not mutated).
- AC2. The enemy team is random, same size as the player's team.
- AC3. With an empty team, starting a battle is not possible.

### US-6 — Damage follows the classic formula
**As a** trainer **I want** damage based on attacking and defending stats
**so that** team choice and stats matter.

- AC1. Physical moves use Attack vs Defense; special moves use Special Attack vs Special Defense.
- AC2. Damage uses `floor(floor(2·Level/5+2) · Power · A/D / 50) + 2` at level 100.
- AC3. Damage is multiplied by a random variance in [0.85, 1.0) and by 1.5 on a critical hit (1/16 chance).
- AC4. Damage is always at least 1.

### US-7 — Turn order is fair and predictable
**As a** trainer **I want** turns resolved consistently
**so that** the battle is understandable.

- AC1. Higher-priority moves go first regardless of Speed (Quick Strike = priority 1).
- AC2. With equal priority, the higher-Speed Pokémon goes first.
- AC3. With equal priority and Speed, the order is random.

### US-8 — Fainting and switching
**As a** trainer **I want** fainted Pokémon replaced automatically
**so that** the battle flows.

- AC1. When a Pokémon faints, the next unfainted Pokémon on that side is sent out.
- AC2. Fainting emits events so the UI can animate and log.
- AC3. When a side has no unfainted Pokémon left, the battle ends and the other side wins.

### US-9 — Battle result
**As a** trainer **I want** a clear victory/defeat screen
**so that** I know how the battle ended.

- AC1. Winning shows victory; losing shows defeat.
- AC2. The battle can be exited back to the setup screen.

## Platform

### US-10 — Works as a desktop app
**As a** trainer **I want** a windowed desktop app that loads my local data file
**so that** I can play offline (sprites aside) and extend it with my own Pokémon.

- AC1. `npm.cmd start` opens the app window.
- AC2. PokemonData.txt is the source of truth, parsed at startup.
- AC3. Adding a line to PokemonData.txt makes the Pokémon appear in the app.
