import { AppState } from "./state.js";

// Status words to filter out (from RealtimeSTT)
const FILTER_WORDS = [
    "speaknow", "speak", "now",  // Handle both separate and concatenated
    "recording", "transcribing", "listening", 
    "ready", "model", "loaded", "error", "warning"
];

function stripFilterWords(word: string): string | null {
    // If word is suspiciously long (> 14 chars), strip filter words
    if (word.length > 14) {
        let cleaned = word;
        let changed = true;
        let iterations = 0;
        
        // Keep stripping until clean or empty (max 20 iterations)
        while (changed && cleaned && iterations < 20) {
            iterations++;
            const original = cleaned;
            
            // Remove all filter words (sorted by length, longest first)
            const sortedFilters = [...FILTER_WORDS].sort((a, b) => b.length - a.length);
            for (const filter of sortedFilters) {
                // Remove all occurrences
                cleaned = cleaned.replace(new RegExp(filter, 'gi'), '');
                // Remove repeated patterns
                while (cleaned.includes(filter + filter)) {
                    cleaned = cleaned.replace(filter + filter, '');
                }
            }
            
            changed = (cleaned !== original);
        }
        
        // If nothing left or too short, skip it
        if (!cleaned || cleaned.length < 2) {
            return null;
        }
        
        // Final check: if it still contains any filter word, skip it
        for (const filter of FILTER_WORDS) {
            if (cleaned.includes(filter)) {
                return null;
            }
        }
        
        return cleaned;
    }
    
    // Normal word - check if it's a filter word
    if (FILTER_WORDS.includes(word)) {
        return null;
    }
    
    return word;
}

export function handleWord(raw: string) {
    // Strip all non-alphabetical characters and convert to lowercase
    let w = raw.toLowerCase().replace(/[^a-z]/g, "").trim();
    if (!w) return;

    // Strip filter words from long concatenated strings
    const cleaned = stripFilterWords(w);
    if (!cleaned) return; // Skip if it was all filter words
    
    w = cleaned;

    AppState.recentWords.push(w);
    while (AppState.recentWords.length > 3) {
    AppState.recentWords.shift();
    }

    checkForPhrases();
}

function checkForPhrases() {
    const q = AppState.recentWords;

    // Build candidates in priority order: 3-word, 2-word, 1-word
    const candidates: string[] = [];
    if (q.length >= 3) {
        const threeWord = q.slice(-3).join(" ");
        candidates.push(threeWord);
    }
    if (q.length >= 2) {
        const twoWord = q.slice(-2).join(" ");
        candidates.push(twoWord);
    }
    if (q.length >= 1) {
        candidates.push(q[q.length - 1]);
    }

    // Debug: log what we're checking
    console.log("[Parser] Checking candidates:", candidates, "from queue:", q);

    // Check in priority order (longest phrases first)
    for (const phrase of candidates) {
        const trimmed = phrase.trim();
        if (AppState.mappings[trimmed]) {
            console.log("[Parser] MATCH:", trimmed, "->", AppState.mappings[trimmed]);
            // Clear the matched words from the queue to prevent re-matching
            const matchedWordCount = trimmed.split(" ").length;
            AppState.recentWords.splice(-matchedWordCount);
            return;
        }
    }
    
    console.log("[Parser] No match found for:", candidates);
}