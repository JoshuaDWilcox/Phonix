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

  // Parse profile: keywords array with keyword -> keymap mappings
  const map: Record<string, string> = {};

  // Profile format: { "keywords": [ { "keyword": "...", "keymap": [...] } ] }
  if (Array.isArray(json.keywords)) {
    for (const entry of json.keywords) {
      if (entry.keyword && entry.keymap) {
        // Store the keymap as JSON string for now (parser will handle it)
        const keyword = entry.keyword.toLowerCase().trim();
        map[keyword] = JSON.stringify(entry.keymap);
      }
    }
  }

  AppState.mappings = map;
  console.log("[ProfileLoader] loaded", Object.keys(map).length, "mappings");
}
