// Tracked safe template. Override values locally; do not commit real API keys.

// RapidAPI key for ExerciseDB (https://rapidapi.com/justin-WFnsXH_t6/api/exercisedb)
// Enables exercise demo GIFs. Leave empty to hide GIFs (users can also add
// their own key in-app via Settings → API keys).
export const EXERCISEDB_API_KEY = '';

// Google Gemini API key (aistudio.google.com) — enables photo → macro breakdown
// in the meal tracker. Leave empty to use manual entry only.
export const GEMINI_API_KEY = '';

// Current app version — bump on every release; compared against GitHub releases.
export const APP_VERSION = '1.0.1';

// GitHub repo for the in-app update checker, e.g. 'yourname/mort-hevyclone'.
export const GITHUB_REPO = 'wamad/mort-hevyclone';

// Automatically check for updates when the app starts (if GITHUB_REPO is set).
export const AUTO_CHECK_UPDATES = true;
