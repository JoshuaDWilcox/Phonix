import { spawn, type ChildProcess } from "child_process";
import path from "path";
import { app } from "electron";
import { isDev } from "../util.js";

let child: ChildProcess | null = null;

export function startControllerBridge() {
  if (child) return; // already running

  const scriptPath = isDev()
    ? path.join(process.cwd(), "src", "python", "controller_bridge.py")
    : path.join(path.dirname(app.getPath("exe")), "src", "python", "controller_bridge.py");

  child = spawn("python", [scriptPath], {
    stdio: ["pipe", "pipe", "pipe"],
  });

  if (child.stdout) {
    child.stdout.on("data", (data) => {
      console.log("[ControllerBridge python]", data.toString().trim());
    });
  }

  if (child.stderr) {
    child.stderr.on("data", (data) => {
      console.error("[ControllerBridge python ERR]", data.toString().trim());
    });
  }

  child.on("exit", (code) => {
    console.log("[ControllerBridge] exited with code", code);
    child = null;
  });
}

export function sendActionToController(action: string) {
  if (!child || !child.stdin) {
    console.warn("[ControllerBridge] not running; cannot send:", action);
    return;
  }

  const msg = JSON.stringify({ action });
  child.stdin.write(msg + "\n");
}

export function stopControllerBridge() {
  if (!child) return;
  console.log("[ControllerBridge] stopping python process");

  const processToKill = child;
  child = null;

  // Try graceful shutdown first
  try {
    if (!processToKill.killed) {
      processToKill.kill("SIGTERM");
    }
  } catch (err) {
    console.error("[ControllerBridge] Error sending SIGTERM:", err);
  }

  // Force kill after a short timeout if it doesn't exit gracefully
  const forceKillTimeout = setTimeout(() => {
    try {
      if (processToKill && !processToKill.killed) {
        console.log("[ControllerBridge] force killing python process");
        processToKill.kill("SIGKILL");
      }
    } catch (err) {
      console.error("[ControllerBridge] Error force killing:", err);
    }
  }, 2000);

  // Clear timeout if process exits gracefully
  processToKill.once("exit", () => {
    clearTimeout(forceKillTimeout);
  });
}

// Export function to check if process is running (for cleanup)
export function isControllerBridgeRunning(): boolean {
  return child !== null && !child.killed;
}
