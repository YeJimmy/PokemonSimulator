// Sprite-map tests for US-15 / task 15.3.
// The app must not do per-Pokemon pokeapi.co lookups at startup:
// src/spriteIds.generated.js (built by scripts/generate-pokemon-data.js)
// covers the whole Gen 1-3 roster, and data.js must prefer it, falling
// back to the network only for names the map doesn't know.
const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const { Pokemon, parsePokemonData, resolveSpriteIds } = require("../src/data.js");
const { SPRITE_IDS } = require("../src/spriteIds.generated.js");

const DATA_FILE = path.join(__dirname, "..", "PokemonData.txt");

// Replace global.fetch with a spy. Returns the spy's call list.
// Restores the original fetch when the returned restore() is called.
function spyOnFetch(impl) {
  const original = global.fetch;
  const calls = [];
  global.fetch = async (url) => {
    calls.push(String(url));
    return impl(url);
  };
  return {
    calls,
    restore() {
      global.fetch = original;
    },
  };
}

const neverCalled = () => {
  throw new Error("fetch must not be called");
};

test("resolves sprite IDs for the full 386-Pokemon roster with zero network lookups", async () => {
  const pokemons = parsePokemonData(fs.readFileSync(DATA_FILE, "utf8"));
  const spy = spyOnFetch(neverCalled);
  try {
    await resolveSpriteIds(pokemons);
  } finally {
    spy.restore();
  }

  assert.equal(spy.calls.length, 0, `network lookups: ${spy.calls.join(", ")}`);
  for (const pokemon of pokemons) {
    assert.equal(
      pokemon.spriteId,
      SPRITE_IDS[pokemon.name],
      `${pokemon.name} spriteId`
    );
  }
});

test("prefers the generated map over the pokeapi.co lookup for known names", async () => {
  const pokemon = new Pokemon({
    Name: "Bulbasaur",
    HP: "294",
    Attack: "197",
    Defense: "197",
    SpecialAttack: "229",
    SpecialDefense: "229",
    Speed: "189",
  });
  const spy = spyOnFetch(neverCalled);
  try {
    await resolveSpriteIds([pokemon]);
  } finally {
    spy.restore();
  }

  assert.equal(spy.calls.length, 0, `network lookups: ${spy.calls.join(", ")}`);
  assert.equal(pokemon.spriteId, SPRITE_IDS["Bulbasaur"]);
});

test("falls back to a pokeapi.co lookup only for names missing from the generated map", async () => {
  const pokemon = new Pokemon({
    Name: "Missingno",
    HP: "1",
    Attack: "1",
    Defense: "1",
    SpecialAttack: "1",
    SpecialDefense: "1",
    Speed: "1",
  });
  const spy = spyOnFetch(async () => ({
    ok: true,
    json: async () => ({ id: 9999 }),
  }));
  try {
    await resolveSpriteIds([pokemon]);
  } finally {
    spy.restore();
  }

  assert.equal(spy.calls.length, 1);
  assert.match(spy.calls[0], /pokeapi\.co\/api\/v2\/pokemon\/missingno$/);
  assert.equal(pokemon.spriteId, 9999);
});
