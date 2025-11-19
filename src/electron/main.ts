import { app, BrowserWindow, ipcMain } from "electron";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import { isDev } from "./util.js";
import { registerBackend } from "./backend/index.js"; //new
import { AppState } from "./backend/state.js";

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

    if (isDev()) {
        mainWindow.loadURL("http://localhost:5123");
    } else {
        mainWindow.loadFile(path.join(app.getAppPath(), "dist-react/index.html"));
    }

    registerBackend(mainWindow);
}

// IPC handler: read filenames from src/profiles
ipcMain.handle("get-profiles", async () => {
    const profilesDir = isDev()
        ? path.join(process.cwd(), "src", "profiles")
        : path.join(app.getAppPath(), "src/profiles");

    try {
        return fs.readdirSync(profilesDir);
    } catch (err) {
        console.error("Failed to read profiles directory:", err);
        return [];
    }
});

ipcMain.handle("setProfilePath", (_, filename: string) => {
    const fullPath = isDev()
        ? path.join(process.cwd(), "src", "profiles", filename)
        : path.join(app.getAppPath(), "src", "profiles", filename);

    console.log("[Backend] Profile selected:", fullPath);

    AppState.profileFilePath = fullPath;
    return "ok";
});


app.on("ready", createWindow);
