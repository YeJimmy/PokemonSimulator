// src/data.js — the data layer.
// Parses PokemonData.txt into Pokemon objects and knows how to find
// sprites for each one via the free PokéAPI sprite CDN.

// PokemonData.txt doesn't store sprite IDs, so we map the names we know.
// If you add a new Pokemon to PokemonData.txt that isn't listed here,
// we fall back to looking its ID up from the PokéAPI at runtime.
const KNOWN_SPRITE_IDS = {
  pikachu: 25,
  charizard: 6,
  blastoise: 9,
  venusaur: 3,
};

const SPRITE_CDN =
  "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon";

class Pokemon {
  constructor(raw) {
    this.name = raw.Name;
    // Stat names in the file -> camelCase. All values are base stats.
    this.stats = {
      hp: Number(raw.HP),
      attack: Number(raw.Attack),
      defense: Number(raw.Defense),
      specialAttack: Number(raw.SpecialAttack),
      specialDefense: Number(raw.SpecialDefense),
      speed: Number(raw.Speed),
    };
    this.total = Object.values(this.stats).reduce((sum, v) => sum + v, 0);
    this.spriteId = null; // filled in by resolveSpriteIds()
  }

  // Official artwork (big, pretty) for the Pokédex detail view.
  get artworkUrl() {
    return this.spriteId
      ? `${SPRITE_CDN}/other/official-artwork/${this.spriteId}.png`
      : null;
  }

  // Front sprite for the enemy side of a battle.
  get frontSpriteUrl() {
    return this.spriteId ? `${SPRITE_CDN}/${this.spriteId}.png` : null;
  }

  // Back sprite for your side of a battle.
  get backSpriteUrl() {
    return this.spriteId ? `${SPRITE_CDN}/back/${this.spriteId}.png` : null;
  }

  // Animated Generation-V sprites for battles (nicer!). Falls back to
  // the static sprites above if the gif 404s — see onerror handlers in app.js.
  get animatedFrontUrl() {
    return this.spriteId
      ? `${SPRITE_CDN}/versions/generation-v/black-white/animated/${this.spriteId}.gif`
      : null;
  }

  get animatedBackUrl() {
    return this.spriteId
      ? `${SPRITE_CDN}/versions/generation-v/black-white/animated/back/${this.spriteId}.gif`
      : null;
  }
}

// PokemonData.txt is whitespace-separated with a header row, e.g.
//   Name HP Attack Defense SpecialAttack SpecialDefense Speed
//   Pikachu 274 209 179 199 199 279
// We split on /\s+/ so it doesn't matter whether the file uses spaces or tabs.
function parsePokemonData(text) {
  const lines = text.split(/\r?\n/).filter((line) => line.trim().length > 0);
  if (lines.length < 2) return [];

  const headers = lines[0].trim().split(/\s+/);
  return lines.slice(1).map((line) => {
    const values = line.trim().split(/\s+/);
    const raw = {};
    headers.forEach((header, i) => {
      raw[header] = values[i];
    });
    return new Pokemon(raw);
  });
}

// Resolve each Pokemon's numeric sprite ID. Known names use the table
// above; anything else is looked up from https://pokeapi.co/api/v2/pokemon/{name}.
async function resolveSpriteIds(pokemons) {
  await Promise.all(
    pokemons.map(async (pokemon) => {
      const key = pokemon.name.toLowerCase();
      if (KNOWN_SPRITE_IDS[key]) {
        pokemon.spriteId = KNOWN_SPRITE_IDS[key];
        return;
      }
      try {
        const res = await fetch(
          `https://pokeapi.co/api/v2/pokemon/${encodeURIComponent(key)}`
        );
        if (res.ok) {
          const data = await res.json();
          pokemon.spriteId = data.id;
        }
      } catch (err) {
        console.warn(`Could not look up sprite ID for ${pokemon.name}:`, err);
      }
    })
  );
}

// Load + parse + resolve in one call. This is what the app uses at startup.
async function loadPokemons() {
  const text = await window.pokemonApi.loadPokemonData();
  const pokemons = parsePokemonData(text);
  await resolveSpriteIds(pokemons);
  return pokemons;
}

// Export for Node (tests) while staying a plain script in the browser,
// where `module` is undefined.
if (typeof module !== "undefined" && module.exports) {
  module.exports = {
    Pokemon,
    parsePokemonData,
    resolveSpriteIds,
    loadPokemons,
    KNOWN_SPRITE_IDS,
    SPRITE_CDN,
  };
}
