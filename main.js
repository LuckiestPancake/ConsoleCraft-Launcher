const { app, BrowserWindow, ipcMain, dialog } = require("electron");
const path = require("path");
const url = require("url");
const Store = require("electron-store");
const store = new Store();

let win;

function createWindow() {
  win = new BrowserWindow({
    width: 1000,
    height: 650,
    resizable: false,
    icon: path.join(__dirname, "media", "icon.png"),
    title: "ConsoleCraft | Launcher",
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    }
  });

  win.setMenu(null);

  win.loadURL(
    url.format({
      pathname: path.join(__dirname, "index.html"),
      protocol: "file:",
      slashes: true,
    })
  );

  win.webContents.on("did-finish-load", () => {
    win.setTitle("ConsoleCraft | Launcher");
  });

  win.webContents.on("page-title-updated", (e) => {
    e.preventDefault();
  });

  win.on("closed", () => {
    win = null;
  });
}

ipcMain.handle("select-skin", async () => {
  const result = await dialog.showOpenDialog(win, {
    properties: ["openFile"],
    filters: [{ name: "Images", extensions: ["png"] }]
  });
  return result.filePaths[0];
});

ipcMain.handle("store-get", (event, key) => store.get(key));
ipcMain.handle("store-set", (event, key, value) => store.set(key, value));

app.on("ready", createWindow);

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});

app.on("activate", () => {
  if (win === null) createWindow();
});
