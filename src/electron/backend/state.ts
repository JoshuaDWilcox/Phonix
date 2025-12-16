export const AppState = {
    profileFilePath: null as string | null,
    isRunning: false,

    // queue for 1–2–3 word matching
    recentWords: [] as string[],

    // phrase → action mapping (empty stub)
    mappings: {} as Record<string, string>,
}