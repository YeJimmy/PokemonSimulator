// src/app.js — the user interface.
// Holds app state, renders the three tabs (Pokédex / Team Builder /
// Battle) and wires up all the buttons. Battle rules live in battle.js,
// loading and parsing lives in data.js — this file is only about the DOM.

const TEAM_STORAGE_KEY = "pokemon-simulator-team";
const MAX_TEAM_SIZE = 6;

const state = {
  pokemons: [], // every Pokémon from PokemonData.txt
  teamNames: [], // names of Pokémon in the player's saved team
  selectedName: null, // which Pokémon the Pokédex detail pane shows
  battle: null, // current Battle instance, or null
  battleBusy: false, // true while battle animations are playing out
};

const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => [...document.querySelectorAll(selector)];
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function findPokemon(name) {
  return state.pokemons.find((p) => p.name === name);
}

function teamPokemons() {
  return state.teamNames.map(findPokemon).filter(Boolean);
}

// ---------- Team persistence ----------

function loadTeam() {
  try {
    const saved = JSON.parse(localStorage.getItem(TEAM_STORAGE_KEY) ?? "[]");
    state.teamNames = Array.isArray(saved) ? saved : [];
  } catch {
    state.teamNames = [];
  }
}

function saveTeam() {
  localStorage.setItem(TEAM_STORAGE_KEY, JSON.stringify(state.teamNames));
}

// ---------- Tabs ----------

function switchTab(tabName) {
  $$(".tab").forEach((btn) =>
    btn.classList.toggle("active", btn.dataset.tab === tabName)
  );
  $$(".view").forEach((view) =>
    view.classList.toggle("active", view.id === `view-${tabName}`)
  );
}

// ---------- Pokédex ----------

function renderPokedexGrid() {
  const grid = $("#pokedex-grid");
  grid.innerHTML = "";

  for (const pokemon of state.pokemons) {
    const card = document.createElement("button");
    card.className = "poke-card";
    card.classList.toggle("selected", pokemon.name === state.selectedName);

    const img = document.createElement("img");
    img.src = pokemon.frontSpriteUrl ?? "";
    img.alt = pokemon.name;
    img.loading = "lazy";

    const name = document.createElement("span");
    name.textContent = pokemon.name;

    card.append(img, name);
    card.addEventListener("click", () => {
      state.selectedName = pokemon.name;
      renderPokedexGrid();
      renderPokedexDetail();
    });
    grid.append(card);
  }
}

const STAT_LABELS = [
  ["HP", "hp"],
  ["Attack", "attack"],
  ["Defense", "defense"],
  ["Sp. Atk", "specialAttack"],
  ["Sp. Def", "specialDefense"],
  ["Speed", "speed"],
];

function renderPokedexDetail() {
  const detail = $("#pokedex-detail");
  const pokemon = findPokemon(state.selectedName);
  if (!pokemon) {
    detail.innerHTML = `<p class="empty-hint">Select a Pokémon to see its stats.</p>`;
    return;
  }

  detail.innerHTML = "";

  const img = document.createElement("img");
  img.className = "detail-art";
  img.src = pokemon.artworkUrl ?? pokemon.frontSpriteUrl ?? "";
  img.alt = pokemon.name;
  img.onerror = () => {
    // Official artwork missing? Fall back to the plain front sprite.
    img.onerror = null;
    if (pokemon.frontSpriteUrl) img.src = pokemon.frontSpriteUrl;
  };

  const title = document.createElement("h2");
  title.textContent = pokemon.name;

  const total = document.createElement("p");
  total.className = "stat-total";
  total.textContent = `Base stat total: ${pokemon.total}`;

  const stats = document.createElement("div");
  stats.className = "stat-bars";
  for (const [label, key] of STAT_LABELS) {
    const value = pokemon.stats[key];
    const row = document.createElement("div");
    row.className = "stat-row";
    row.innerHTML = `
      <span class="stat-label">${label}</span>
      <div class="stat-track"><div class="stat-fill" style="width: ${Math.min(
        100,
        (value / 400) * 100
      )}%"></div></div>
      <span class="stat-value">${value}</span>`;
    stats.append(row);
  }

  detail.append(img, title, total, stats);
}

// ---------- Team Builder ----------

function renderTeamBuilder() {
  const list = $("#team-all-list");
  const count = $("#team-count");
  const slots = $("#team-slots");
  const summary = $("#team-summary");

  list.innerHTML = "";
  for (const pokemon of state.pokemons) {
    const inTeam = state.teamNames.includes(pokemon.name);
    const row = document.createElement("div");
    row.className = "team-row";
    row.innerHTML = `
      <img src="${pokemon.frontSpriteUrl ?? ""}" alt="${pokemon.name}" />
      <span class="team-row-name">${pokemon.name}</span>
      <span class="team-row-total">BST ${pokemon.total}</span>
      <button class="btn small ${inTeam ? "danger" : "primary"}">
        ${inTeam ? "Remove" : "Add"}
      </button>`;
    row.querySelector("button").addEventListener("click", () => {
      toggleTeamMember(pokemon.name);
    });
    list.append(row);
  }

  count.textContent = `${state.teamNames.length} / ${MAX_TEAM_SIZE}`;

  slots.innerHTML = "";
  for (let i = 0; i < MAX_TEAM_SIZE; i++) {
    const slot = document.createElement("div");
    const member = state.teamNames[i] ? findPokemon(state.teamNames[i]) : null;
    slot.className = member ? "team-slot filled" : "team-slot";
    if (member) {
      slot.innerHTML = `
        <img src="${member.frontSpriteUrl ?? ""}" alt="${member.name}" />
        <span>${member.name}</span>
        <button class="slot-remove" aria-label="Remove ${member.name}">×</button>`;
      slot.querySelector(".slot-remove").addEventListener("click", () =>
        toggleTeamMember(member.name)
      );
    } else {
      slot.innerHTML = `<span class="slot-empty">Empty</span>`;
    }
    slots.append(slot);
  }

  const members = teamPokemons();
  if (members.length > 0) {
    const avg = (key) =>
      Math.round(
        members.reduce((sum, p) => sum + p.stats[key], 0) / members.length
      );
    summary.innerHTML = `
      <h3>Team averages</h3>
      <div class="summary-grid">
        ${STAT_LABELS.map(
          ([label, key]) =>
            `<div><span>${label}</span><strong>${avg(key)}</strong></div>`
        ).join("")}
      </div>`;
  } else {
    summary.innerHTML = `<p class="empty-hint">Your team is empty. Add some Pokémon!</p>`;
  }

  renderBattleSetup(); // keep the battle tab in sync with the team
}

function toggleTeamMember(name) {
  const index = state.teamNames.indexOf(name);
  if (index >= 0) {
    state.teamNames.splice(index, 1);
  } else if (state.teamNames.length < MAX_TEAM_SIZE) {
    state.teamNames.push(name);
  }
  saveTeam();
  renderTeamBuilder();
}

// ---------- Battle ----------

function renderBattleSetup() {
  $("#setup-team").innerHTML = "";
  const members = teamPokemons();
  $("#battle-empty").classList.toggle("hidden", members.length > 0);
  $("#battle-ready").classList.toggle("hidden", members.length === 0);

  for (const member of members) {
    const img = document.createElement("img");
    img.src = member.frontSpriteUrl ?? "";
    img.alt = member.name;
    img.title = member.name;
    $("#setup-team").append(img);
  }
}

function startBattle() {
  const members = teamPokemons();
  if (members.length === 0) return;

  const enemy = buildEnemyTeam(state.pokemons, members.length);
  state.battle = new Battle(members, enemy);
  state.battleBusy = false;

  $("#battle-setup").classList.add("hidden");
  $("#battle-scene").classList.remove("hidden");
  $("#battle-result").classList.add("hidden");
  $("#battle-log").innerHTML = "";

  logBattle("A wild enemy team appeared!");
  renderBattleSprites();
  updateHpBars();
  setMoveButtonsEnabled(true);
}

function spriteImg(url, fallbackUrl, alt) {
  const img = document.createElement("img");
  img.alt = alt;
  img.onerror = () => {
    // Animated gif missing? Fall back to the static sprite.
    img.onerror = null;
    if (fallbackUrl) img.src = fallbackUrl;
  };
  img.src = url ?? fallbackUrl ?? "";
  return img;
}

function renderBattleSprites() {
  const battle = state.battle;
  const enemyBox = $("#enemy-sprite-box");
  const playerBox = $("#player-sprite-box");
  enemyBox.innerHTML = "";
  playerBox.innerHTML = "";

  const enemy = battle.activeE.pokemon;
  const player = battle.activeP.pokemon;

  enemyBox.append(spriteImg(enemy.animatedFrontUrl, enemy.frontSpriteUrl, enemy.name));
  playerBox.append(spriteImg(player.animatedBackUrl, player.backSpriteUrl, player.name));

  $("#enemy-name").textContent = enemy.name;
  $("#player-name").textContent = player.name;
}

function updateHpBars() {
  const battle = state.battle;
  for (const side of ["player", "enemy"]) {
    const combatant = side === "player" ? battle.activeP : battle.activeE;
    const pct = (combatant.currentHp / combatant.maxHp) * 100;
    const fill = $(`#${side}-hp-fill`);
    fill.style.width = `${pct}%`;
    fill.classList.toggle("low", pct <= 20);
    fill.classList.toggle("mid", pct > 20 && pct <= 50);
    $(`#${side}-hp-text`).textContent = `${combatant.currentHp} / ${combatant.maxHp}`;
  }
}

function setMoveButtonsEnabled(enabled) {
  $$("#move-buttons button").forEach((btn) => (btn.disabled = !enabled));
}

function logBattle(text) {
  const log = $("#battle-log");
  const line = document.createElement("p");
  line.textContent = text;
  log.append(line);
  log.scrollTop = log.scrollHeight;
}

async function handleMoveClick(move) {
  if (!state.battle || state.battleBusy || state.battle.over) return;
  state.battleBusy = true;
  setMoveButtonsEnabled(false);

  const events = state.battle.takeTurn(move);
  await playBattleEvents(events);

  if (state.battle.over) {
    $("#battle-result").classList.remove("hidden");
    $("#battle-result-text").textContent =
      state.battle.winner === "player" ? "Victory!" : "Defeat...";
  } else {
    setMoveButtonsEnabled(true);
  }
  state.battleBusy = false;
}

async function playBattleEvents(events) {
  for (const event of events) {
    logBattle(event.text);

    if (event.type === "attack") {
      const targetBox =
        event.actor === "player" ? $("#enemy-sprite-box") : $("#player-sprite-box");
      targetBox.classList.add("hit");
      updateHpBars();
      await sleep(650);
      targetBox.classList.remove("hit");
    }

    if (event.type === "faint") {
      const box =
        event.actor === "enemy" ? $("#enemy-sprite-box") : $("#player-sprite-box");
      box.classList.add("fainted");
      await sleep(600);
    }

    if (event.type === "switch") {
      renderBattleSprites();
      updateHpBars();
      $("#enemy-sprite-box").classList.remove("fainted");
      $("#player-sprite-box").classList.remove("fainted");
      await sleep(400);
    }
  }
  updateHpBars();
}

function exitBattle() {
  state.battle = null;
  $("#battle-scene").classList.add("hidden");
  $("#battle-setup").classList.remove("hidden");
}

// ---------- Startup ----------

async function init() {
  // Tabs
  $$(".tab").forEach((btn) =>
    btn.addEventListener("click", () => switchTab(btn.dataset.tab))
  );

  // Team builder buttons
  $("#clear-team-btn").addEventListener("click", () => {
    state.teamNames = [];
    saveTeam();
    renderTeamBuilder();
  });

  // Battle buttons
  $("#start-battle-btn").addEventListener("click", startBattle);
  $("#exit-battle-btn").addEventListener("click", exitBattle);
  $("#go-to-team-btn").addEventListener("click", () => switchTab("team"));

  // Move buttons
  const moveButtons = $("#move-buttons");
  for (const move of MOVES) {
    const btn = document.createElement("button");
    btn.className = "btn move-btn";
    btn.innerHTML = `
      <span class="move-name">${move.name}</span>
      <span class="move-meta">${move.kind === "physical" ? "Physical" : "Special"} · Power ${move.power}${move.priority > 0 ? " · Priority" : ""}</span>`;
    btn.title = move.description;
    btn.addEventListener("click", () => handleMoveClick(move));
    moveButtons.append(btn);
  }

  loadTeam();

  try {
    state.pokemons = await loadPokemons();
  } catch (err) {
    $("#load-error").classList.remove("hidden");
    $("#load-error-text").textContent = String(err);
    return;
  }

  state.selectedName = state.pokemons[0]?.name ?? null;
  renderPokedexGrid();
  renderPokedexDetail();
  renderTeamBuilder(); // also calls renderBattleSetup()
}

init();
