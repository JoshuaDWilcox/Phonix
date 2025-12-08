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

    // Read profile content
    readProfile: (filename: string): Promise<any> => ipcRenderer.invoke("readProfile", filename),

    // Save profile content
    saveProfile: (filename: string, content: any): Promise<string> => ipcRenderer.invoke("saveProfile", filename, content),

    // Import profile dialog
    importProfile: (): Promise<string | null> => ipcRenderer.invoke("import-profile"),
});

console.log("Preload loaded!");