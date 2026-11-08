# Pills Tracker

An Android app that helps a person keep track of their medication: which pills to take and when, how many are left in the box, and a full-screen alarm that rings at each dose time.

The app is built with Expo and React Native, stores all data on the phone, and its interface is in Spanish.

## Features

- **Pill list and next dose.** The home screen shows the next pill in a large card with a countdown, followed by the full list of pills (photo, reason, schedule, remaining stock).
- **Dose schedules.** Each pill has a first-dose time (for example 07:00) and an interval between doses, set in hours (1–24) or minutes (5–180, in steps of 5). Doses never fall closer together than the interval, and each day restarts at the first-dose time.
- **Alarms.** Each dose time gets a daily-repeating Android alarm that shows a full-screen alert over the lock screen. Pills due at the same time share one alert.
  - **Hecho** records the dose as taken and subtracts it from the stock. It also works from the notification while the app is closed.
  - **Posponer** rings again in 5 minutes. Snoozing stops one hour after the dose time.
  - An ignored alarm stops after one hour, and the dose is recorded as missed.
- **Stock tracking.** Units per dose and units in the box are tracked, with an estimate of days left and a low-stock warning at 3 days. Doses written as text (for example "media" or "5 ml") are displayed as typed and do not reduce the stock.
- **Photos.** Take a photo of a pill or pick one from the gallery. Photos are stored on the device and included in backups.
- **Permission health check.** A red banner appears when notifications, exact alarms, or the full-screen permission are off, with a button to fix it. This is checked each time the app comes to the foreground.
- **Backup and restore.** Export all data (including photos) to a file through the share sheet, or import a backup. Importing replaces all current data, after confirmation.
- **Text size.** Normal, Grande, or Muy grande, remembered on the device.

## Tech stack

| Area | Technology |
| --- | --- |
| Framework | [Expo](https://expo.dev) SDK 58 with [React Native](https://reactnative.dev) 0.88 and React 19 |
| Navigation | [Expo Router](https://docs.expo.dev/router/introduction/) (file-based routing in `src/app/`) |
| Storage | [expo-sqlite](https://docs.expo.dev/versions/latest/sdk/sqlite/) with versioned migrations |
| Notifications and alarms | [@notifee/react-native](https://notifee.app) and a small local Expo module for Android alarm permissions |
| Photos and files | expo-image-picker, expo-image-manipulator, expo-file-system, expo-document-picker, expo-sharing |
| Tests | Jest with `jest-expo` |
| Language | TypeScript |

## Project structure

```
src/
  app/          Screens (Expo Router): home, pill add/edit, Herramientas, root layout
  alarm/        Alarm scheduling, the full-screen alarm flow, background handling, permission checks
  backup/       Backup file export and import
  components/   Reusable UI pieces (pill form, steppers, banners, alarm overlay, ...)
  db/           SQLite database setup and migrations, and the data repository
  domain/       Pure business logic: schedules, dose engine, stock maths, backup format, formatting
  photos/       Photo storage on the device
  settings/     Settings screens (text size)
  theme.ts      Shared visual theme
modules/
  alarm-permissions/   Local Expo module to read and open the Android full-screen permission setting
plugins/
  withAlarmAndSigning.js   Expo config plugin for the native Android alarm and signing setup
scripts/
  build-apk.sh  Local release build that writes the APK to builds/
builds/         Built APKs (one per version and build number)
```

The `domain/` folder contains the logic that decides what is due and what is in stock. It does not depend on the UI or the database, which makes it the easiest part to test.

## Getting started

### Prerequisites

- Node.js and npm
- Android SDK and a JDK (Temurin 17 is used by the build script) for native builds
- An Android phone or emulator

### Install

```bash
npm install
```

Use `npx expo install <package>` to add dependencies so that versions match the Expo SDK.

### Run on a device

The app needs a development build because it uses native modules (notifications, exact alarms, and the alarm permissions module). Expo Go does not include them.

```bash
npm run android      # expo run:android: builds and installs a debug build
npm start            # starts the Metro dev server for an already-installed development build
```

### Build a release APK

```bash
scripts/build-apk.sh             # bumps android.versionCode, prebuilds, and assembles a signed release APK
scripts/build-apk.sh --no-bump   # same build without changing the version code
```

The APK is copied to `builds/pills-tracker-v<version>-b<versionCode>.apk`. Each build increments `android.versionCode` in `app.json`, so a new APK installs over the previous one.

## Testing and checks

```bash
npm test             # runs the Jest test suites in src/**/__tests__/
npx tsc --noEmit     # typecheck
npx expo lint        # lint
npx expo-doctor      # check dependency and configuration health
```

Most tests cover the `domain/` logic (schedules, dose engine, stock, backup format, pill form validation, text size) and the alarm problem detection.

## Configuration

- **Package and version:** `app.json` (`expo.android.package`, `expo.version`, `expo.android.versionCode`).
- **Permissions:** `app.json` (`expo.android.permissions`). The app requests notifications, exact alarms, full-screen intents, boot completion, and battery-optimization exemption.
- **Android SDK level:** `minSdkVersion` is 31 (Android 12), set through `expo-build-properties`.

The app is currently Android-only. There is no `ios/` directory and no iOS configuration.

## Data and privacy

All data stays on the device: the SQLite database, pill photos, and preferences. Nothing is sent to a server. Backups are plain files that you share yourself.

## Changelog

Release notes are in [CHANGELOG.md](./CHANGELOG.md).

## License

This project is licensed under the MIT License. See [LICENSE](./LICENSE).
