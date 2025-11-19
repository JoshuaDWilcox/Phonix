import { contextBridge, ipcRenderer } from "electron";

contextBridge.exposeInMainWorld("api", {
    getProfiles: (): Promise<string[]> => ipcRenderer.invoke("get-profiles")
});

console.log("Preload loaded!");