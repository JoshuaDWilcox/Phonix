import { spawn, ChildProcess } from "child_process";
import path from "path";
import { AppState } from "./state.js";
import { handleWord } from "./parser.js";


let child: ChildProcess | null = null;
let buffer = "";

export function startSpeechFromPython() {
    if (child) {
    // already running
    return;
    }

    const scriptPath = path.join(
    process.cwd(),
    "src",
    "python",
    "speech_stub.py" // temporary python file, will be replaced with speech to text AI parser in future sprints. just here for architecture right now
    );

    child = spawn("python", [scriptPath], {
    stdio: ["ignore", "pipe", "pipe"], // we only read its stdout/stderr
    });

    console.log("[SpeechBridge] started python:", scriptPath);

    if ( child.stdout ) {
        child.stdout.on("data", (data) => {
            const text = data.toString();
            buffer += text;

            // split by lines, keep last partial line in buffer
            const lines = buffer.split(/\r?\n/);
            buffer = lines.pop() ?? "";

            for (const line of lines) {
                const trimmed = line.trim();
                if (!trimmed) continue;
                // Ignore log lines like "[speech_stub] ready"
                if (trimmed.startsWith("[") && trimmed.endsWith("]")) {
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
    
    if ( child.stderr )
    {
        child.stderr.on("data", (data) => {
            console.error("[SpeechBridge python ERR]", data.toString().trim());
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
    child.kill();
    child = null;
    buffer = "";
}
