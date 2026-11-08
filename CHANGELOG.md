# Changelog

## b23 — Pills or drops, intervals in minutes
- Labels say "Pastillas/gotas". A numeric dose is shown as a number without a unit ("Dosis: 2"), since it may be drops.
- The interval can be set in hours (1–24) or minutes (5–180, steps of 5). More than 100 alarms a day is refused.
- A dose counts as missed one hour after it was due, or when the next dose is due if that is sooner (so a every-15-minutes pill is missed after 15 minutes). Snoozing stops at the same point.

## b22 — Dose field selects its text on tap
- Tapping "Pastillas por toma" selects the current value, so typing replaces the default "1" instead of appending to it.

## b21 — Text doses
- "Pastillas por toma" accepts text ("media", "1/2", "5 ml") as well as numbers. The home card and the alarm show it as typed.
- A whole-number dose still subtracts that many pills from the box when you press Hecho. A text dose subtracts nothing, and no "days left" estimate is made for it.

## b20 — Photo check reads the file back
- b19/b17 wrongly rejected good photos: File.size read 0 right after writing. The check now reads the bytes back instead.

## b19 — Photo saving fallback
- If copying the picked photo into the app's storage leaves no usable file (seen on a Samsung: "No se pudo guardar la foto"), the app now writes the image data directly. If both fail, the error lists what failed.

## b18 — Alarm sound on the alarm volume
- The alarm channel now uses Android's ALARM audio usage, so the sound is no longer muted by vibrate mode or a zero notification volume (seen on a Samsung SM-T509A: vibrated but made no sound).

## b17 — Photo diagnostics
- A photo that can't be shown (form or home list) now says so, with the reason, instead of staying blank.
- Saving a photo checks that the file exists and isn't empty.

## b16 — Text size selector
- Text size selector in Herramientas (Normal / Grande / Muy grande). It scales all text and the +/− buttons, and is remembered on the phone. The phone's own font size setting is ignored; this is the only control.

## b15 — Steppers wrap instead of overlapping
- Hora and Minutos steppers go on separate lines when the screen is too narrow, instead of overlapping.

## b14 — Simpler pill cards
- Home pill cards show only the name, "Cada X hs" and "Próxima a las X hs": no reason, no remaining stock.

## b13 — Home pill cards
- Each pill card shows two lines: "Cada 8 hs" and "Próxima a las 15:00 hs".

## b12 — UI fixes from the Samsung A04e
- Steppers are compact so + and − no longer overlap on narrow screens.
- Every screen pads for the Android navigation bar, so the bottom buttons are no longer hidden.
- "Pastillas por toma" replaces the free-text dose field (and is no longer repeated lower down). The alarm and next-pill card now say "1 pastilla" / "2 pastillas".
- "Tomar foto" and "Elegir de galería" share one row.

## b11 — Slice 3: alarms linked to pills
- Every pill now rings: one daily-repeating Android alarm per clock time, re-synced on launch and whenever pills change.
- Pills due at the same time share one alarm screen (names, doses, photos).
- Hecho records the dose as taken and reduces stock once; works from the notification with the app closed.
- Posponer rings again in 5 minutes; no snooze past 1 hour after the dose time.
- An ignored alarm stops after 1 hour; unanswered doses are recorded as missed.
- Pill form: "Primera toma" and "Cada cuánto" are separate sections.

## b9 — Slice 2: pill screens
- New home: next pill in a big card with countdown, then the pill list (photo, reason, schedule, stock, low-stock warning at 3 days).
- Add / edit / delete pill screen: big text, +/- steppers for time and interval, camera or gallery photo, stock and units per dose. Confirmation on save (edit) and delete.
- Photos are included in the backup file.
- Alarm test and backup moved to "Herramientas".
- App now uses Expo Router.

## b8 — Permission health
- Installing an update revokes the Android 14 full-screen permission on some phones (seen on Samsung A04e).
- Red banner at the top whenever notifications, exact alarms or full-screen are off, with an "Activar" button. Re-checked every time the app comes to the front.
- Small native module (modules/alarm-permissions) to read and open the full-screen setting.

## b7 — Slice 1: data, schedule, backup
- Local SQLite database (pills, doses) with migrations.
- Dose schedule: every N hours from a daily first-dose time. Doses never closer than N hours.
- Stock maths (units per dose, days left, refill).
- Export a backup file through the share sheet; import it back (replaces all data, asks first).
- Version and build number shown on the test screen.

## b6 — Slice 0: alarm spike
- Full-screen alarm over the lock screen, with Hecho and Posponer 5 min.
