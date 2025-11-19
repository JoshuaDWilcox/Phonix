import { contextBridge, ipcRenderer } from "electron";

contextBridge.exposeInMainWorld("api", {
    getProfiles: (): Promise<string[]> => ipcRenderer.invoke("get-profiles"),

    // File chooser for selecting profile
    chooseProfileFile: (): Promise<string | null> => ipcRenderer.invoke("chooseProfileFile"),

    // Start backend session (loads profile + starts python stub)
    startSession: (): Promise<string> => ipcRenderer.invoke("startSession"),

    // Stop python & clear state
    stopSession: (): Promise<string> => ipcRenderer.invoke("stopSession"),

    setProfilePath: (filename: string) => ipcRenderer.invoke("setProfilePath", filename),
});

console.log("Preload loaded!");