import { app, BrowserWindow, ipcMain } from "electron";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import { isDev } from "./util.js";
import { registerBackend } from "./backend/index.js"; //new

// Recreate __dirname for ESM (your project is ESM)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function createWindow() {
    const mainWindow = new BrowserWindow({
        webPreferences: {
            preload: path.join(__dirname, "preload.js"),
            contextIsolation: true,
            nodeIntegration: false
        }
    });

<<<<<<< HEAD
//new
function createMainWindow() {
    const mainWindow = new BrowserWindow({
        width: 900,
        height: 700,
        webPreferences: {

        },
    });

    if (isDev()) {
        mainWindow.loadURL("http://localhost:5123");
    } else {
        mainWindow.loadFile(
            path.join(app.getAppPath(), "/dist-react/index.html")
        );
    }

    registerBackend(mainWindow);
}

app.on("ready", () => {
    const mainWindow = new BrowserWindow({});
=======
>>>>>>> 02000b6 (BB-21: Profiles Dropdown Added)
    if (isDev()) {
        mainWindow.loadURL("http://localhost:5123");
    } else {
        mainWindow.loadFile(path.join(app.getAppPath(), "dist-react/index.html"));
    }
<<<<<<< HEAD
    createMainWindow();
});
=======
}

// IPC handler: read filenames from src/profiles
ipcMain.handle("get-profiles", async () => {
    const profilesDir = path.join(app.getAppPath(), "src/profiles");

    try {
        return fs.readdirSync(profilesDir);
    } catch (err) {
        console.error("Failed to read profiles directory:", err);
        return [];
    }
});

app.on("ready", createWindow);
>>>>>>> 02000b6 (BB-21: Profiles Dropdown Added)
