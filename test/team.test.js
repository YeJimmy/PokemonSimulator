// Team-rules tests for src/team.js.
// Run with: npm test
const test = require("node:test");
const assert = require("node:assert/strict");

const {
  MIN_TEAM_SIZE,
  MAX_TEAM_SIZE,
  Team,
} = require("../src/team.js");

test("team size bounds are 1 to 6", () => {
  assert.equal(MIN_TEAM_SIZE, 1);
  assert.equal(MAX_TEAM_SIZE, 6);
});

test("a new team starts empty, or from initial names", () => {
  assert.deepEqual(new Team().names, []);
  assert.deepEqual(new Team(["Bulbasaur", "Charmander"]).names, [
    "Bulbasaur",
    "Charmander",
  ]);
});

test("a restored team is deduplicated and truncated to 6", () => {
  const team = new Team(["A", "A", "B", "C", "D", "E", "F", "G"]);
  assert.deepEqual(team.names, ["A", "B", "C", "D", "E", "F"]);
});

test("a full restored team refuses further adds", () => {
  const team = new Team(["A", "B", "C", "D", "E", "F", "G"]);
  assert.equal(team.names.length, MAX_TEAM_SIZE);
  assert.equal(team.canAdd("H"), false);
  team.add("H");
  assert.deepEqual(team.names, ["A", "B", "C", "D", "E", "F"]);
});

test("add and remove report whether they changed the team", () => {
  const team = new Team(["A"]);

  assert.equal(team.add("B"), true); // new member
  assert.equal(team.add("A"), false); // duplicate
  assert.equal(team.remove("Z"), false); // non-member
  assert.equal(team.remove("A"), true); // removed
});

test("canAdd allows a new member onto a non-full team", () => {
  assert.equal(new Team().canAdd("Pikachu"), true);
  assert.equal(new Team(["Bulbasaur", "Charmander"]).canAdd("Pikachu"), true);
});

test("canAdd allows filling the 6th slot", () => {
  const team = new Team(["A", "B", "C", "D", "E"]);
  assert.equal(team.canAdd("F"), true);
});

test("canAdd rejects a 7th member", () => {
  const team = new Team(["A", "B", "C", "D", "E", "F"]);
  assert.equal(team.canAdd("G"), false);
});

test("canAdd rejects a species already on the team", () => {
  const team = new Team(["Pikachu", "Eevee"]);
  assert.equal(team.canAdd("Pikachu"), false);
});

test("add appends a new member", () => {
  const team = new Team(["Bulbasaur"]);
  team.add("Charmander");

  assert.deepEqual(team.names, ["Bulbasaur", "Charmander"]);
});

test("add ignores a duplicate species", () => {
  const team = new Team(["Pikachu", "Eevee"]);
  team.add("Pikachu");

  assert.deepEqual(team.names, ["Pikachu", "Eevee"]);
});

test("add ignores a 7th member", () => {
  const team = new Team(["A", "B", "C", "D", "E", "F"]);
  team.add("G");

  assert.deepEqual(team.names, ["A", "B", "C", "D", "E", "F"]);
});

test("remove takes a member out and keeps the rest in order", () => {
  const team = new Team(["A", "B", "C", "D"]);
  team.remove("B");

  assert.deepEqual(team.names, ["A", "C", "D"]);
});

test("remove is a no-op for a non-member", () => {
  const team = new Team(["A", "B"]);
  team.remove("Z");

  assert.deepEqual(team.names, ["A", "B"]);
});

test("a full team can be edited down and refilled", () => {
  const team = new Team(["A", "B", "C", "D", "E", "F"]);
  assert.equal(team.canAdd("G"), false);

  team.remove("A");
  assert.equal(team.canAdd("G"), true);

  team.add("G");
  assert.deepEqual(team.names, ["B", "C", "D", "E", "F", "G"]);
});

test("clear empties the team", () => {
  const team = new Team(["A", "B", "C"]);
  team.clear();

  assert.deepEqual(team.names, []);
});
