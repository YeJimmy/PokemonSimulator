// src/battle.js — the battle engine.
// Pure logic, no DOM: it takes teams in, and reports events out through
// callbacks. The UI (app.js) renders those events as sprites, HP bars
// and a log. This separation keeps the rules easy to test and tweak.

// Every Pokémon gets the same three generic moves, built from its stats.
// (PokemonData.txt doesn't include per-Pokémon movesets, so we derive
// ones that make stat spread meaningful: Attack vs Special Attack etc.)
const MOVES = [
  {
    name: "Tackle",
    power: 80,
    kind: "physical", // uses Attack vs Defense
    priority: 0,
    description: "A reliable physical hit. Uses Attack.",
  },
  {
    name: "Special Blast",
    power: 100,
    kind: "special", // uses SpecialAttack vs SpecialDefense
    priority: 0,
    description: "A heavy special hit. Uses Special Attack.",
  },
  {
    name: "Quick Strike",
    power: 55,
    kind: "physical",
    priority: 1, // always goes first
    description: "Low power, but always strikes first.",
  },
];

const BATTLE_LEVEL = 100;

// A combatant is a Pokemon plus battle-specific state (current HP).
class Combatant {
  constructor(pokemon) {
    this.pokemon = pokemon;
    this.maxHp = pokemon.stats.hp;
    this.currentHp = pokemon.stats.hp;
  }

  get fainted() {
    return this.currentHp <= 0;
  }
}

class Battle {
  // playerTeam / enemyTeam: arrays of Pokemon. They are cloned into
  // Combatants so battling never mutates the Pokédex copies.
  constructor(playerTeam, enemyTeam) {
    this.player = playerTeam.map((p) => new Combatant(p));
    this.enemy = enemyTeam.map((p) => new Combatant(p));
    this.activePlayer = 0;
    this.activeEnemy = 0;
    this.over = false;
    this.winner = null;
  }

  get activeP() {
    return this.player[this.activePlayer];
  }

  get activeE() {
    return this.enemy[this.activeEnemy];
  }

  // Simplified Pokémon damage formula at level 100, with a little
  // random variance and a 1/16 critical-hit chance.
  calculateDamage(attacker, defender, move) {
    const a =
      move.kind === "physical"
        ? attacker.pokemon.stats.attack
        : attacker.pokemon.stats.specialAttack;
    const d =
      move.kind === "physical"
        ? defender.pokemon.stats.defense
        : defender.pokemon.stats.specialDefense;

    const base =
      Math.floor(
        Math.floor((2 * BATTLE_LEVEL) / 5 + 2) * move.power * (a / d) / 50
      ) + 2;

    const isCrit = Math.random() < 1 / 16;
    const variance = 0.85 + Math.random() * 0.15;
    const damage = Math.max(1, Math.floor(base * variance * (isCrit ? 1.5 : 1)));
    return { damage, isCrit };
  }

  // The enemy AI: pick a random move, but lean toward Special Blast
  // when it has the Special Attack advantage, and Tackle otherwise.
  enemyChooseMove() {
    const e = this.activeE.pokemon.stats;
    const p = this.activeP.pokemon.stats;
    const specialRatio = e.specialAttack / Math.max(1, p.specialDefense);
    const physicalRatio = e.attack / Math.max(1, p.defense);
    if (specialRatio > physicalRatio * 1.1) return MOVES[1];
    if (physicalRatio > specialRatio * 1.1) return MOVES[0];
    return MOVES[Math.floor(Math.random() * MOVES.length)];
  }

  // Run one full turn. `playerMove` is an entry from MOVES.
  // Returns a list of events so the UI can narrate what happened.
  takeTurn(playerMove) {
    if (this.over) return [];

    const events = [];
    const enemyMove = this.enemyChooseMove();

    // Turn order: priority first, then Speed, then a coin flip on ties.
    const order = this.decideOrder(playerMove, enemyMove);

    for (const actor of order) {
      if (this.over) break;

      const attacker = actor === "player" ? this.activeP : this.activeE;
      const defender = actor === "player" ? this.activeE : this.activeP;
      const move = actor === "player" ? playerMove : enemyMove;
      const attackerName = actor === "player" ? "Your" : "Enemy";

      if (attacker.fainted || defender.fainted) continue;

      const { damage, isCrit } = this.calculateDamage(attacker, defender, move);
      defender.currentHp = Math.max(0, defender.currentHp - damage);

      events.push({
        type: "attack",
        actor,
        move: move.name,
        damage,
        isCrit,
        targetHp: defender.currentHp,
        targetMaxHp: defender.maxHp,
        text: `${attackerName} ${attacker.pokemon.name} used ${move.name}!${
          isCrit ? " A critical hit!" : ""
        } (${damage} damage)`,
      });

      if (defender.fainted) {
        events.push({
          type: "faint",
          actor: actor === "player" ? "enemy" : "player",
          text: `${defender.pokemon.name} fainted!`,
        });
        this.handleFaint(actor === "player" ? "enemy" : "player", events);
      }
    }

    return events;
  }

  decideOrder(playerMove, enemyMove) {
    if (playerMove.priority !== enemyMove.priority) {
      return playerMove.priority > enemyMove.priority ? ["player", "enemy"] : ["enemy", "player"];
    }
    const pSpeed = this.activeP.pokemon.stats.speed;
    const eSpeed = this.activeE.pokemon.stats.speed;
    if (pSpeed === eSpeed) return Math.random() < 0.5 ? ["player", "enemy"] : ["enemy", "player"];
    return pSpeed > eSpeed ? ["player", "enemy"] : ["enemy", "player"];
  }

  // After a faint, send in the next Pokémon or end the battle.
  handleFaint(side, events) {
    const team = side === "player" ? this.player : this.enemy;
    const nextIndex = team.findIndex((c) => !c.fainted);

    if (nextIndex === -1) {
      this.over = true;
      this.winner = side === "player" ? "enemy" : "player";
      events.push({
        type: "battle-end",
        winner: this.winner,
        text:
          this.winner === "player"
            ? "You won the battle!"
            : "You lost the battle...",
      });
      return;
    }

    if (side === "player") this.activePlayer = nextIndex;
    else this.activeEnemy = nextIndex;

    events.push({
      type: "switch",
      side,
      pokemonIndex: nextIndex,
      text:
        side === "player"
          ? `Go, ${team[nextIndex].pokemon.name}!`
          : `Enemy sent out ${team[nextIndex].pokemon.name}!`,
    });
  }
}

// Build an enemy team of `size` Pokémon, chosen at random (with repeats
// allowed when the Pokédex is smaller than the team size).
function buildEnemyTeam(allPokemons, size) {
  const team = [];
  for (let i = 0; i < size; i++) {
    team.push(allPokemons[Math.floor(Math.random() * allPokemons.length)]);
  }
  return team;
}

// Export for Node (tests) while staying a plain script in the browser,
// where `module` is undefined.
if (typeof module !== "undefined" && module.exports) {
  module.exports = {
    MOVES,
    BATTLE_LEVEL,
    Combatant,
    Battle,
    buildEnemyTeam,
  };
}
