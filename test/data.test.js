// Parser and data-model tests for src/data.js.
// Run with: npm test
const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const { Pokemon, parsePokemonData } = require("../src/data.js");

const DATA_FILE = path.join(__dirname, "..", "PokemonData.txt");

test("parses every row of the real PokemonData.txt", () => {
  const text = fs.readFileSync(DATA_FILE, "utf8");
  const pokemons = parsePokemonData(text);

  assert.equal(pokemons.length, 386);
  assert.deepEqual(
    pokemons.slice(0, 3).map((p) => p.name),
    ["Bulbasaur", "Ivysaur", "Venusaur"]
  );
  assert.ok(pokemons.some((p) => p.name === "Pikachu"));
});

test("header columns map to camelCase stats", () => {
  const text = fs.readFileSync(DATA_FILE, "utf8");
  const pikachu = parsePokemonData(text).find((p) => p.name === "Pikachu");

  assert.deepEqual(pikachu.stats, {
    hp: 274,
    attack: 209,
    defense: 179,
    specialAttack: 199,
    specialDefense: 199,
    speed: 279,
  });
});

test("stat total is the sum of all six stats", () => {
  const text = fs.readFileSync(DATA_FILE, "utf8");
  const pikachu = parsePokemonData(text).find((p) => p.name === "Pikachu");

  assert.equal(
    pikachu.total,
    274 + 209 + 179 + 199 + 199 + 279 // 1339
  );
});

test("handles CRLF line endings", () => {
  const text =
    "Name HP Attack Defense SpecialAttack SpecialDefense Speed\r\n" +
    "Pikachu 274 209 179 199 199 279\r\n";
  const pokemons = parsePokemonData(text);

  assert.equal(pokemons.length, 1);
  assert.equal(pokemons[0].name, "Pikachu");
  assert.equal(pokemons[0].stats.hp, 274);
});

test("ignores blank lines", () => {
  const text = [
    "Name HP Attack Defense SpecialAttack SpecialDefense Speed",
    "",
    "Pikachu 274 209 179 199 199 279",
    "   ",
    "Charizard 360 267 255 317 269 299",
    "",
  ].join("\n");
  const pokemons = parsePokemonData(text);

  assert.deepEqual(
    pokemons.map((p) => p.name),
    ["Pikachu", "Charizard"]
  );
});

test("returns an empty array when there is no data", () => {
  assert.deepEqual(parsePokemonData(""), []);
  assert.deepEqual(parsePokemonData("Name HP Attack\n"), []);
});

test("sprite URLs embed the numeric sprite ID", () => {
  const p = new Pokemon({
    Name: "Testmon",
    HP: "1",
    Attack: "2",
    Defense: "3",
    SpecialAttack: "4",
    SpecialDefense: "5",
    Speed: "6",
  });
  p.spriteId = 25;

  assert.match(p.artworkUrl, /\/other\/official-artwork\/25\.png$/);
  assert.match(p.frontSpriteUrl, /\/25\.png$/);
  assert.match(p.backSpriteUrl, /\/back\/25\.png$/);
  assert.match(p.animatedFrontUrl, /\/animated\/25\.gif$/);
  assert.match(p.animatedBackUrl, /\/animated\/back\/25\.gif$/);
});
