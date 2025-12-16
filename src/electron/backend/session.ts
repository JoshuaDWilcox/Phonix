import { AppState } from "./state.js";
import { startSpeechFromPython, stopSpeechFromPython } from "./speech.js";
import { loadProfileMappings } from "./profileLoader.js";
import { startControllerBridge, stopControllerBridge } from "./controllerBridge.js";

// Callback to notify UI of status changes
let onSessionStateChange: ((isRunning: boolean, error?: string) => void) | null = null;

export function setSessionStateCallback(cb: (isRunning: boolean, error?: string) => void) {
  onSessionStateChange = cb;
}

export function startSession() {
  if (!AppState.profileFilePath) {
    throw new Error("No profile JSON selected!");
  }

  console.log("[Session] Starting with:", AppState.profileFilePath);

  loadProfileMappings();
  startControllerBridge();
  AppState.isRunning = true;

  // TODO: read JSON, build AppState.mappings
  startSpeechFromPython();
}

export function stopSession(error: boolean = false) {
  AppState.isRunning = false;
  stopSpeechFromPython();
  stopControllerBridge();
  console.log("[Session] Stopped");

  if (onSessionStateChange) {
    onSessionStateChange(false, error ? "Controller process failed" : undefined);
  }
}
