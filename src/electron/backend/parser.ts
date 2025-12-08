import { AppState } from "./state.js";

export function handleWord(raw: string) {
    // Strip all non-alphabetical characters and convert to lowercase
    const w = raw.toLowerCase().replace(/[^a-z]/g, "").trim();
    if (!w) return;

    AppState.recentWords.push(w);
    while (AppState.recentWords.length > 3) {
    AppState.recentWords.shift();
    }

    checkForPhrases();
}

function checkForPhrases() {
    const q = AppState.recentWords;

    const candidates: string[] = [];
    if (q.length >= 3) candidates.push(q.slice(-3).join(" "));
    if (q.length >= 2) candidates.push(q.slice(-2).join(" "));
    if (q.length >= 1) candidates.push(q[q.length - 1]);

    for (const phrase of candidates) {
        if (AppState.mappings[phrase]) {
            console.log("[ParserStub] MATCH:", phrase, "->", AppState.mappings[phrase]);
            return;
        }
    }
}