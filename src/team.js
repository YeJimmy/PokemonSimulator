// src/team.js: the team membership rules.
// Pure logic, no DOM: a Team holds the names of the player's chosen
// Pokémon and enforces the team rules — at most MAX_TEAM_SIZE species-
// unique members. The rules hold for restored teams too: initial names
// are deduplicated and truncated to MAX_TEAM_SIZE at construction. The
// UI (app.js) renders the team and delegates every add/remove/clear
// decision here so the rules stay testable headlessly.

const MIN_TEAM_SIZE = 1;
const MAX_TEAM_SIZE = 6;

class Team {
  // `names` (optional): the member names to start with, e.g. when
  // restoring a saved team. Deduplicated and truncated to MAX_TEAM_SIZE
  // so a corrupt saved team can't break the team rules.
  constructor(names = []) {
    this.names = [...new Set(names)].slice(0, MAX_TEAM_SIZE);
  }

  // A Pokémon can be added only if the team isn't full and the species
  // isn't already on it.
  canAdd(name) {
    return this.names.length < MAX_TEAM_SIZE && !this.names.includes(name);
  }

  // Adds `name` if canAdd() allows it; otherwise does nothing.
  // Returns true when the member was added.
  add(name) {
    if (!this.canAdd(name)) return false;
    this.names.push(name);
    return true;
  }

  // Removes `name` if present. Returns true when a member was removed.
  remove(name) {
    const index = this.names.indexOf(name);
    if (index === -1) return false;
    this.names.splice(index, 1);
    return true;
  }

  // Empties the team.
  clear() {
    this.names.length = 0;
  }
}

// Export for Node (tests) while staying a plain script in the browser,
// where `module` is undefined.
if (typeof module !== "undefined" && module.exports) {
  module.exports = {
    MIN_TEAM_SIZE,
    MAX_TEAM_SIZE,
    Team,
  };
}
