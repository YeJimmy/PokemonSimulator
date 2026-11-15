// Battle-engine tests for src/battle.js.
// Run with: npm test
const test = require("node:test");
const assert = require("node:assert/strict");

const {
  MOVES,
  BATTLE_LEVEL,
  Combatant,
  Battle,
  buildEnemyTeam,
} = require("../src/battle.js");

// Build a minimal fake Pokémon. `total` is unused by the engine.
const mk = (n, hp, atk, def, spa, spd, spe) => ({
  name: n,
  stats: {
    hp,
    attack: atk,
    defense: def,
    specialAttack: spa,
    specialDefense: spd,
    speed: spe,
  },
  total: 0,
});

const TACKLE = MOVES[0]; // physical, power 80, no priority
const SPECIAL_BLAST = MOVES[1]; // special, power 100, no priority
const QUICK_STRIKE = MOVES[2]; // physical, power 55, priority 1

// Run `fn` with Math.random() returning `values` in sequence; the last
// value is repeated if more calls happen.
function withMockedRandom(values, fn) {
  const original = Math.random;
  let i = 0;
  Math.random = () => values[Math.min(i++, values.length - 1)];
  try {
    return fn();
  } finally {
    Math.random = original;
  }
}

test("combatant starts at full HP", () => {
  const c = new Combatant(mk("A", 300, 1, 1, 1, 1, 1));
  assert.equal(c.currentHp, 300);
  assert.equal(c.maxHp, 300);
  assert.equal(c.fainted, false);

  c.currentHp = 0;
  assert.equal(c.fainted, true);
});

test("battle uses BATTLE_LEVEL 100 and clone semantics", () => {
  // The documented level the damage formula uses.
  assert.equal(BATTLE_LEVEL, 100);

  // Pokédex copies must not be mutated by battling.
  const pika = mk("Pikachu", 274, 209, 179, 199, 199, 279);
  const battle = new Battle([pika], [mk("Foe", 100, 1, 1, 1, 1, 1)]);
  battle.takeTurn(TACKLE);
  assert.equal(pika.stats.hp, 274); // original untouched
});

test("physical damage uses the classic formula (variance 1.0, no crit)", () => {
  const battle = new Battle(
    [mk("Hitter", 300, 200, 100, 100, 100, 50)],
    [mk("Wall", 500, 1, 100, 1, 100, 10)]
  );
  // Math.random(): [no-crit, variance=1.0]
  const { damage, isCrit } = withMockedRandom([0.99, 1], () =>
    battle.calculateDamage(battle.activeP, battle.activeE, TACKLE)
  );

  // floor(floor(2*100/5+2) * 80 * 200/100 / 50) + 2 = floor(134.4) + 2 = 136
  assert.equal(isCrit, false);
  assert.equal(damage, 136);
});

test("special damage uses special attack vs special defense", () => {
  const battle = new Battle(
    [mk("Caster", 300, 1, 1, 150, 1, 50)],
    [mk("Target", 500, 1, 1, 1, 100, 10)]
  );
  const { damage } = withMockedRandom([0.99, 1], () =>
    battle.calculateDamage(battle.activeP, battle.activeE, SPECIAL_BLAST)
  );

  // floor(42 * 100 * 150/100 / 50) + 2 = 126 + 2 = 128
  assert.equal(damage, 128);
});

test("critical hits deal 1.5x damage", () => {
  const battle = new Battle(
    [mk("Hitter", 300, 200, 100, 100, 100, 50)],
    [mk("Wall", 500, 1, 100, 1, 100, 10)]
  );
  // [crit, variance=1.0]
  const { damage, isCrit } = withMockedRandom([0, 1], () =>
    battle.calculateDamage(battle.activeP, battle.activeE, TACKLE)
  );

  assert.equal(isCrit, true);
  assert.equal(damage, Math.floor(136 * 1.5)); // 204
});

test("damage is never less than 1", () => {
  const battle = new Battle(
    [mk("Weak", 100, 1, 1, 1, 1, 50)],
    [mk("Tank", 10000, 1, 100000, 1, 100000, 10)]
  );
  // [no-crit, minimum variance]
  const { damage } = withMockedRandom([0.99, 0], () =>
    battle.calculateDamage(battle.activeP, battle.activeE, TACKLE)
  );

  assert.equal(damage, 1);
});

test("higher priority move goes first regardless of speed", () => {
  const battle = new Battle(
    [mk("Slow", 300, 1, 1, 1, 1, 10)], // very slow
    [mk("Fast", 300, 1, 1, 1, 1, 999)] // very fast
  );
  const order = battle.decideOrder(QUICK_STRIKE, SPECIAL_BLAST);
  assert.deepEqual(order, ["player", "enemy"]);
});

test("with equal priority the faster Pokémon goes first", () => {
  const battle = new Battle(
    [mk("Slow", 300, 1, 1, 1, 1, 100)],
    [mk("Fast", 300, 1, 1, 1, 1, 200)]
  );
  assert.deepEqual(battle.decideOrder(TACKLE, TACKLE), ["enemy", "player"]);
});

test("equal priority and speed: order decided by random roll", () => {
  const battle = new Battle(
    [mk("A", 300, 1, 1, 1, 1, 100)],
    [mk("B", 300, 1, 1, 1, 1, 100)]
  );
  assert.deepEqual(
    withMockedRandom([0.3], () => battle.decideOrder(TACKLE, TACKLE)),
    ["player", "enemy"]
  );
  assert.deepEqual(
    withMockedRandom([0.7], () => battle.decideOrder(TACKLE, TACKLE)),
    ["enemy", "player"]
  );
});

test("a turn applies damage to both sides and reports events", () => {
  const battle = new Battle(
    [mk("Hitter", 300, 200, 100, 100, 100, 50)],
    [mk("Wall", 900, 10, 100, 10, 100, 10)]
  );
  // Enemy AI rolls first (stat tie → random pick; 0 picks Tackle).
  // Then player moves first (50 > 10).
  const events = withMockedRandom([0, 0.99, 1, 0.99, 1], () =>
    battle.takeTurn(TACKLE)
  );

  const attacks = events.filter((e) => e.type === "attack");
  assert.equal(attacks.length, 2); // both Pokémon strike
  assert.equal(attacks[0].actor, "player");
  assert.equal(attacks[0].damage, 136); // player hits enemy
  assert.match(attacks[0].text, /Hitter used Tackle/);

  // Enemy's counterattack: atk 10 vs def 100 → at least 1 damage
  assert.ok(attacks[1].damage >= 1);
  assert.equal(battle.activeE.currentHp, 900 - 136);
});

test("fainting the last enemy Pokémon ends the battle: player wins", () => {
  const battle = new Battle(
    [mk("Hitter", 300, 200, 100, 100, 100, 50)],
    [mk("Weak", 100, 1, 100, 1, 100, 10)]
  );
  const events = withMockedRandom([0, 0.99, 1, 0.99, 1], () =>
    battle.takeTurn(TACKLE)
  );

  assert.equal(battle.over, true);
  assert.equal(battle.winner, "player");
  assert.ok(events.some((e) => e.type === "faint" && e.actor === "enemy"));
  assert.ok(events.some((e) => e.type === "battle-end" && e.winner === "player"));
});

test("enemy switches to the next Pokémon after a faint", () => {
  const battle = new Battle(
    [mk("Hitter", 300, 200, 100, 100, 100, 50)],
    [mk("Weak", 100, 1, 100, 1, 100, 10), mk("Reserve", 900, 1, 100, 1, 100, 20)]
  );
  const events = withMockedRandom([0, 0.99, 1, 0.99, 1], () =>
    battle.takeTurn(TACKLE)
  );

  assert.equal(battle.over, false);
  assert.equal(battle.activeEnemy, 1); // Reserve sent out
  assert.equal(battle.activeE.pokemon.name, "Reserve");
  assert.ok(events.some((e) => e.type === "switch" && e.side === "enemy"));
});

test("player faints and switches; battle continues", () => {
  const battle = new Battle(
    [mk("Fragile", 100, 1, 1, 1, 1, 10), mk("Backup", 300, 1, 1, 1, 1, 20)],
    [mk("Crusher", 900, 500, 100, 500, 100, 100)]
  );
  // Enemy is faster, hits first, one-shots Fragile.
  const events = battle.takeTurn(TACKLE);

  assert.equal(battle.over, false);
  assert.equal(battle.activePlayer, 1); // Backup sent out
  assert.equal(battle.activeP.pokemon.name, "Backup");
  assert.ok(events.some((e) => e.type === "faint" && e.actor === "player"));
  assert.ok(events.some((e) => e.type === "switch" && e.side === "player"));
});

test("losing all your Pokémon ends the battle: enemy wins", () => {
  const battle = new Battle(
    [mk("Fragile", 100, 1, 1, 1, 1, 10)],
    [mk("Crusher", 900, 500, 100, 500, 100, 100)]
  );
  const events = battle.takeTurn(TACKLE);

  assert.equal(battle.over, true);
  assert.equal(battle.winner, "enemy");
  assert.ok(events.some((e) => e.type === "battle-end" && e.winner === "enemy"));
});

test("buildEnemyTeam returns a random team of the requested size", () => {
  const pool = [mk("A", 1, 1, 1, 1, 1, 1), mk("B", 1, 1, 1, 1, 1, 1)];
  const team = withMockedRandom([0.1, 0.9, 0.2], () => buildEnemyTeam(pool, 3));

  assert.equal(team.length, 3);
  assert.deepEqual(team.map((p) => p.name), ["A", "B", "A"]);
});
