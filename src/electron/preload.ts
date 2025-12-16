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

    // Listen for session status updates (e.g. error stops)
    onSessionStatus: (callback: (data: { isRunning: boolean; error?: string }) => void) => {
        const subscription = (_: any, data: any) => callback(data);
        ipcRenderer.on("session-status", subscription);
        return () => ipcRenderer.removeListener("session-status", subscription);
    },

    // Listen for recorder ready signal
    onRecorderReady: (callback: () => void) => {
        const subscription = () => callback();
        ipcRenderer.on("on-recorder-ready", subscription);
        return () => ipcRenderer.removeListener("on-recorder-ready", subscription);
    }
});

console.log("Preload loaded!");