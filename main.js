// main.js — Electron "main process".
// This is the Node.js side of the app: it creates the desktop window
// and reads PokemonData.txt from disk (renderer pages can't do that
// directly for security reasons).
const { app, BrowserWindow, ipcMain } = require("electron");
const fs = require("node:fs/promises");
const path = require("node:path");

// Renderer asks for this over IPC (see preload.js) and gets the raw text back.
ipcMain.handle("load-pokemon-data", () =>
  fs.readFile(path.join(__dirname, "PokemonData.txt"), "utf8")
);

function createWindow() {
  const win = new BrowserWindow({
    width: 1150,
    height: 780,
    minWidth: 900,
    minHeight: 600,
    autoHideMenuBar: true,
    backgroundColor: "#0f1226",
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true, // renderer can't touch Node/Electron directly
      nodeIntegration: false,
    },
  });

  win.loadFile(path.join(__dirname, "src", "index.html"));
}

app.whenReady().then(() => {
  createWindow();

  // macOS: re-create the window when the dock icon is clicked.
  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});
