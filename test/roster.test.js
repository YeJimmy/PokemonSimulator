// Roster tests for US-15: the full Generation 1-3 Pokédex.
// These were written test-first against the current 4-row PokemonData.txt
// and were red until the generator ran.
const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const { parsePokemonData } = require("../src/data.js");
const { SPRITE_IDS } = require("../src/spriteIds.generated.js");

const DATA_FILE = path.join(__dirname, "..", "PokemonData.txt");
const parse = () => parsePokemonData(fs.readFileSync(DATA_FILE, "utf8"));

test("PokemonData.txt holds the full Gen 1-3 roster (386 entries)", () => {
  assert.equal(parse().length, 386);
});

test("roster is in National Dex order, starting with Bulbasaur", () => {
  const names = parse().map((p) => p.name);
  assert.deepEqual(names.slice(0, 5), [
    "Bulbasaur",
    "Ivysaur",
    "Venusaur",
    "Charmander",
    "Charmeleon",
  ]);
  assert.equal(names[150], "Mew"); // dex 151
  assert.equal(names[385], "Deoxys-Normal"); // dex 386, PokéAPI name
});

test("stat formulas match the original file's scale (HP = 2b+204, others = 2b+99)", () => {
  const [bulbasaur, ivysaur, venusaur] = parse();
  // Bulbasaur base: 45/49/49/65/65/45
  assert.deepEqual(bulbasaur.stats, {
    hp: 294, attack: 197, defense: 197,
    specialAttack: 229, specialDefense: 229, speed: 189,
  });
  // Ivysaur base: 60/62/63/80/80/60
  assert.deepEqual(ivysaur.stats, {
    hp: 324, attack: 223, defense: 225,
    specialAttack: 259, specialDefense: 259, speed: 219,
  });
  // Venusaur base: 80/82/83/100/100/80 (was already in the original file)
  assert.deepEqual(venusaur.stats, {
    hp: 364, attack: 263, defense: 265,
    specialAttack: 299, specialDefense: 299, speed: 259,
  });
});

test("the original four Pokémon's stats are unchanged", () => {
  const byName = new Map(parse().map((p) => [p.name, p]));
  const expected = {
    Pikachu:   { hp: 274, attack: 209, defense: 179, specialAttack: 199, specialDefense: 199, speed: 279 },
    Charizard: { hp: 360, attack: 267, defense: 255, specialAttack: 317, specialDefense: 269, speed: 299 },
    Blastoise: { hp: 362, attack: 265, defense: 299, specialAttack: 269, specialDefense: 309, speed: 255 },
    Venusaur:  { hp: 364, attack: 263, defense: 265, specialAttack: 299, specialDefense: 299, speed: 259 },
  };
  for (const [name, stats] of Object.entries(expected)) {
    assert.deepEqual(byName.get(name)?.stats, stats, name);
  }
});

test("names are unique and are single whitespace-free tokens", () => {
  const names = parse().map((p) => p.name);
  assert.equal(new Set(names).size, names.length);
  for (const name of names) assert.match(name, /^\S+$/);
});

test("sprite map covers every name in the data file with the correct dex id", () => {
  const names = parse().map((p) => p.name);
  for (let i = 0; i < names.length; i++) {
    assert.equal(SPRITE_IDS[names[i]], i + 1, names[i]);
  }
});

test("stats stay within sane bounds for the L100 max-IV/EV formulas", () => {
  for (const p of parse()) {
    assert.ok(p.stats.hp >= 200 && p.stats.hp <= 800, `${p.name} hp ${p.stats.hp}`); // Shedinja hp: base 1 -> 206
    for (const key of ["attack", "defense", "specialAttack", "specialDefense", "speed"]) {
      assert.ok(p.stats[key] >= 100 && p.stats[key] <= 600, `${p.name} ${key}`); // Shuckle defense: base 230 -> 559
    }
  }
});
