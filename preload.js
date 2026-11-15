// preload.js — a tiny, safe bridge between the Node world (main.js)
// and the web page (src/index.html). It exposes exactly one function,
// window.pokemonApi.loadPokemonData(), and nothing else.
const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("pokemonApi", {
  loadPokemonData: () => ipcRenderer.invoke("load-pokemon-data"),
});
