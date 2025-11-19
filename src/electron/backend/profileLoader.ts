import fs from "fs";
import path from "path";
import { AppState } from "./state.js";

export function loadProfileMappings() {
  if (!AppState.profileFilePath) {
    throw new Error("No profile selected");
  }

  const filePath = AppState.profileFilePath;

  const raw = fs.readFileSync(filePath, "utf-8");
  const json = JSON.parse(raw);

  // parse into the map below VVVV

  const map: Record<string, string> = {};

  if (Array.isArray(json.mappings)) {
    for (const entry of json.mappings) {
      if (entry.phrase && entry.action) {
        map[entry.phrase.toLowerCase()] = entry.action;
      }
    }
  }

  AppState.mappings = map;
  console.log("[ProfileLoader] loaded", Object.keys(map).length, "mappings");
}
