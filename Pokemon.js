var fs = require("fs");
var textByLine = fs.readFileSync('PokemonData.txt').ToString().split("\n");

function createPokemons(PokemonData) {
        
}

function Pokemon(PokemonName) {
    this.name = PokemonName;
}

const Pikachu = new Pokemon("Pikachu");

//Choosing and putting together your team
function createPokemonTeam() {
}

//