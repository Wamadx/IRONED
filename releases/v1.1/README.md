# v1.1 Release Instructions

## Build APK with EAS
```bash
# Install EAS CLI if not already installed
npm install -g eas-cli

# Authenticate with your Expo account
npx eas login

# Ensure you are on the correct project
npx eas project:info

# Build the APK for production (uses profile defined in eas.json)
npx eas build --platform android --profile production
```

The command will upload your project to Expo servers, compile it, and provide a download link for the generated APK.

## Quick Release Checklist
1. **Version bump** – `app.json` version is now `1.1`.
2. **Android `versionCode`** – set to `2` (increment for every binary release).
3. **Run tests** – `npm run lint` and manually verify the app on a device.
4. **Upload** – after the build finishes, download the APK and optionally distribute via internal testing or the Play Store.
5. **Changelog** – add any notable changes in `releases/v1.1/CHANGELOG.md`.
