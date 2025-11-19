import { spawn, type ChildProcess } from "child_process";
import path from "path";

let child: ChildProcess | null = null;

export function startControllerBridge() {
  if (child) return; // already running

  const scriptPath = path.join(
    process.cwd(),
    "src",
    "python",
    "controller_bridge.py"
  );

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
  child.kill();
  child = null;
}
