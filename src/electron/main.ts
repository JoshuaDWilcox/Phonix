import { app, BrowserWindow, ipcMain } from "electron";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import { isDev } from "./util.js";
import { registerBackend } from "./backend/index.js"; //new
import { AppState } from "./backend/state.js";
import { stopSpeechFromPython, isSpeechProcessRunning } from "./backend/speech.js";
import { stopControllerBridge, isControllerBridgeRunning } from "./backend/controllerBridge.js";
import { stopSession } from "./backend/session.js";

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

// Cleanup function to kill all Python processes
function cleanupPythonProcesses() {
    console.log("[Main] Cleaning up Python processes...");
    
    // Stop session (which stops both speech and controller bridge)
    stopSession();
    
    // Double-check and force kill if still running
    if (isSpeechProcessRunning()) {
        console.log("[Main] Force killing speech process");
        stopSpeechFromPython();
    }
    
    if (isControllerBridgeRunning()) {
        console.log("[Main] Force killing controller bridge process");
        stopControllerBridge();
    }
}

// Handle app quitting
app.on("before-quit", () => {
    console.log("[Main] App before-quit event");
    cleanupPythonProcesses();
});

app.on("will-quit", () => {
    console.log("[Main] App will-quit event");
    cleanupPythonProcesses();
});

// Handle process signals (Ctrl+C, etc.)
process.on("SIGINT", () => {
    console.log("[Main] SIGINT received, cleaning up...");
    cleanupPythonProcesses();
    app.quit();
});

process.on("SIGTERM", () => {
    console.log("[Main] SIGTERM received, cleaning up...");
    cleanupPythonProcesses();
    app.quit();
});

// Handle uncaught exceptions
process.on("uncaughtException", (error) => {
    console.error("[Main] Uncaught exception:", error);
    cleanupPythonProcesses();
    app.quit();
});

// Handle unhandled promise rejections
process.on("unhandledRejection", (reason, promise) => {
    console.error("[Main] Unhandled rejection at:", promise, "reason:", reason);
    cleanupPythonProcesses();
    app.quit();
});
