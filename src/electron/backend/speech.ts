import { spawn, ChildProcess } from "child_process";
import path from "path";
import { app } from "electron";
import { isDev } from "../util.js";
import { AppState } from "./state.js";
import { handleWord } from "./parser.js";


let child: ChildProcess | null = null;
let buffer = "";

export function startSpeechFromPython(window: any) {
    if (child) {
        // already running
        return;
        // already running
        return;
    }

    const scriptPath = isDev()
        ? path.join(process.cwd(), "src", "python", "speech_stub.py")
        : path.join(path.dirname(app.getPath("exe")), "src", "python", "speech_stub.py");

    child = spawn("python3", [scriptPath], {
        stdio: ["ignore", "pipe", "pipe"], // we only read its stdout/stderr
    });

    console.log("[SpeechBridge] started python:", scriptPath);

    if (child.stdout) {
        child.stdout.on("data", (data) => {
            const text = data.toString();
            buffer += text;

            // split by lines, keep last partial line in buffer
            const lines = buffer.split(/\r?\n/);
            buffer = lines.pop() ?? "";

            for (const line of lines) {
                const trimmed = line.trim();
                if (!trimmed) continue;
                // Ignore log lines like "[speech] ready" or "[speech] model loaded"
                if (trimmed.startsWith("[speech]") || (trimmed.startsWith("[") && trimmed.endsWith("]"))) {
                    console.log("[SpeechBridge python log]", trimmed);
                    continue;
                }

                console.log("[SpeechBridge] word/phrase from python:", trimmed);
                if (AppState.isRunning) {
                    handleWord(trimmed);
                }
            }
        });
    }

    if (child.stderr) {
        child.stderr.on("data", (data) => {
            const msg = data.toString().trim();
            // console.error("[SpeechBridge python ERR]", msg); // Optional: keep or comment out to reduce noise

            // Check for ready signal
            if (msg.includes("[speech] ready") || msg.includes("[speech] model loaded")) {
                console.log("[SpeechBridge] Python speech ready!");
                window.webContents.send("on-recorder-ready");
            }
        });
    }

    child.on("exit", (code) => {
        console.log("[SpeechBridge] python exited with code", code);
        child = null;
    });
}

export function stopSpeechFromPython() {
    if (!child) return;
    console.log("[SpeechBridge] stopping python speech process");

    const processToKill = child;
    child = null;
    buffer = "";

    // Try graceful shutdown first
    try {
        if (!processToKill.killed) {
            processToKill.kill("SIGTERM");
        }
    } catch (err) {
        console.error("[SpeechBridge] Error sending SIGTERM:", err);
    }

    // Force kill after a short timeout if it doesn't exit gracefully
    const forceKillTimeout = setTimeout(() => {
        try {
            if (processToKill && !processToKill.killed) {
                console.log("[SpeechBridge] force killing python process");
                processToKill.kill("SIGKILL");
            }
        } catch (err) {
            console.error("[SpeechBridge] Error force killing:", err);
        }
    }, 2000);

    // Clear timeout if process exits gracefully
    processToKill.once("exit", () => {
        clearTimeout(forceKillTimeout);
    });
}

// Export function to check if process is running (for cleanup)
export function isSpeechProcessRunning(): boolean {
    return child !== null && !child.killed;
}
