import { ipcMain, dialog, BrowserWindow } from "electron";
import { AppState } from "./state.js";
import { startSession, stopSession, setSessionStateCallback } from "./session.js";

export function registerBackend(window: BrowserWindow) {
  // Listen for session state changes and notify renderer
  setSessionStateCallback((isRunning, error) => {
    if (!window.isDestroyed()) {
      window.webContents.send("session-status", { isRunning, error });
    }
  });

  ipcMain.handle("chooseProfileFile", async () => {
    const result = await dialog.showOpenDialog(window, {
      filters: [{ name: "JSON", extensions: ["json"] }],
      properties: ["openFile"],
    });

    if (result.canceled) return null;

    AppState.profileFilePath = result.filePaths[0];
    console.log("[Backend] Profile set:", AppState.profileFilePath);
    return AppState.profileFilePath;
  });

  ipcMain.handle("startSession", async () => {
    startSession(window);
    return "ok";
  });

  ipcMain.handle("stopSession", async () => {
    stopSession();
    return "ok";
  });
}
