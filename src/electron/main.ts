import { app, BrowserWindow } from 'electron';
import path from 'path';
import { isDev } from "./util.js";
import { registerBackend } from "./backend/index.js"; //new

// type test = string; // testing type-script purpose only

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
    if (isDev()) {
        mainWindow.loadURL('http://localhost:5123');
    } else {
        mainWindow.loadFile(path.join(app.getAppPath(), '/dist-react/index.html'));
    }
    createMainWindow();
});