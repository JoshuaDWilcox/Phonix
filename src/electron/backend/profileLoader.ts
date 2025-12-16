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

  // Load synonyms and expand mappings
  const synonymsPath = path.join(process.cwd(), "src", "profiles", "synonyms", "synonyms.json");
  if (fs.existsSync(synonymsPath)) {
    const synonymsRaw = fs.readFileSync(synonymsPath, "utf-8");
    const synonymsJson = JSON.parse(synonymsRaw);
    if (Array.isArray(synonymsJson.synonyms)) {
      for (const entry of synonymsJson.synonyms) {
        const baseKeyword = entry.keyword_match.toLowerCase().trim();
        if (map[baseKeyword]) {
          const baseKeymap = map[baseKeyword];
          for (const synonym of entry.synonym_words) {
            const synKey = synonym.toLowerCase().trim();
            if (!map[synKey]) {
              map[synKey] = baseKeymap;
            }
          }
        }
      }
    }
  }
  AppState.mappings = map;
  console.log("[ProfileLoader] loaded", Object.keys(map).length, "mappings");
  // Debug: show a few example mappings
  const examples = Object.keys(map).slice(0, 5);
  console.log("[ProfileLoader] example mappings:", examples);
}
