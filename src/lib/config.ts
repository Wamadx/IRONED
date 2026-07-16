// Config — safe to commit. API keys default to empty; users can supply
// their own keys in-app via Settings → API keys.

// RapidAPI key for ExerciseDB (https://rapidapi.com/justin-WFnsXH_t6/api/exercisedb)
// Enables exercise demo GIFs. Leave empty to hide GIFs (users can also add
// their own key in-app via Settings → API keys).
export const EXERCISEDB_API_KEY = '';

// Google Gemini API key (aistudio.google.com) — enables photo → macro breakdown
// in the meal tracker. Leave empty to use manual entry only.
export const GEMINI_API_KEY = '';

// Current app version — bump on every release; compared against GitHub releases.
export const APP_VERSION = '1.1.0';

// GitHub repo for the in-app update checker, e.g. 'yourname/ironed'.
export const GITHUB_REPO = '';
