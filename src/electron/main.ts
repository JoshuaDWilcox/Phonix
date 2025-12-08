import { app, BrowserWindow, ipcMain, dialog } from "electron";
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
const getAllProfileFiles = (dir: string, fileList: string[] = [], baseDir: string = dir): string[] => {
    const files = fs.readdirSync(dir);

    files.forEach(file => {
        const filePath = path.join(dir, file);
        const stat = fs.statSync(filePath);

        if (stat.isDirectory()) {
            if (file !== "synonyms") {
                getAllProfileFiles(filePath, fileList, baseDir);
            }
        } else {
            if (file.endsWith(".json")) {
                // Store path relative to the base profiles directory
                fileList.push(path.relative(baseDir, filePath));
            }
        }
    });

    return fileList;
};

// IPC handler: read filenames from src/profiles
ipcMain.handle("get-profiles", async () => {
    const profilesDir = isDev()
        ? path.join(process.cwd(), "src", "profiles")
        : path.join(app.getAppPath(), "src/profiles");

    try {
        return getAllProfileFiles(profilesDir);
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


// IPC handler: read a specific profile JSON
ipcMain.handle("readProfile", async (_, filename: string) => {
    const fullPath = isDev()
        ? path.join(process.cwd(), "src", "profiles", filename)
        : path.join(app.getAppPath(), "src", "profiles", filename);

    try {
        const content = fs.readFileSync(fullPath, "utf-8");
        return JSON.parse(content);
    } catch (err) {
        console.error("Failed to read profile:", fullPath, err);
        return null;
    }
});

// IPC handler: save a specific profile JSON
ipcMain.handle("saveProfile", async (_, filename: string, content: any) => {
    const fullPath = isDev()
        ? path.join(process.cwd(), "src", "profiles", filename)
        : path.join(app.getAppPath(), "src", "profiles", filename);

    try {
        fs.writeFileSync(fullPath, JSON.stringify(content, null, 4), "utf-8");
        return "ok";
    } catch (err) {
        console.error("Failed to save profile:", fullPath, err);
        throw err;
    }
});

// IPC handler: import a profile JSON from file system
ipcMain.handle("import-profile", async () => {
    const { canceled, filePaths } = await dialog.showOpenDialog({
        title: "Import Control Profile",
        properties: ["openFile"],
        filters: [{ name: "JSON", extensions: ["json"] }]
    });

    if (canceled || filePaths.length === 0) {
        return null;
    }

    const sourcePath = filePaths[0];
    const filename = path.basename(sourcePath);

    const profilesDir = isDev()
        ? path.join(process.cwd(), "src", "profiles")
        : path.join(app.getAppPath(), "src/profiles");

    const destPath = path.join(profilesDir, filename);

    try {
        fs.copyFileSync(sourcePath, destPath);
        console.log("[Backend] Imported profile:", destPath);
        return filename;
    } catch (err) {
        console.error("Failed to import profile:", err);
        return null;
    }
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
