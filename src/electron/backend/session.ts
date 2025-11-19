import { AppState } from "./state.js";
import { startSpeechFromPython, stopSpeechFromPython } from "./speech.js";
import { loadProfileMappings } from "./profileLoader.js";
import { startControllerBridge, stopControllerBridge } from "./controllerBridge.js";

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

export function stopSession() {
  AppState.isRunning = false;
  stopSpeechFromPython();
  stopControllerBridge();
  console.log("[Session] Stopped");
}
