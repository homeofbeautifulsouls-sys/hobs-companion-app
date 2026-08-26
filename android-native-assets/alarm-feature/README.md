# Real, native task/subtask alarm (August 26, 2026, shipped in v3.16)

Replaces the old behavior where a task/subtask alarm just fired a normal FCM push notification
(one vibration, no real ringing, no Stop/Snooze) -- exactly the bug Akash reported. A push
notification structurally cannot do what a real alarm clock does; this uses
`AlarmManager.setAlarmClock()` (the one API that behaves like a genuine alarm-clock alarm --
shows the status-bar alarm icon, is exempt from Doze/battery-optimization deferral, and needs no
special runtime permission, unlike `SCHEDULE_EXACT_ALARM`/`USE_EXACT_ALARM`) plus a real
full-screen ringing activity with looping sound, vibration, and Stop/Snooze.

## Files here, and where they go on every fresh Android build

Copy each `.java` file to `android/app/src/main/java/com/hobsfoundation/companion/`:
- `AlarmScheduler.java` -- central schedule/cancel/reboot-reschedule logic + SharedPreferences bookkeeping
- `AlarmReceiver.java` -- BroadcastReceiver AlarmManager fires; wakes the device, launches AlarmActivity
- `AlarmActivity.java` -- the actual full-screen ringing UI (looping alarm sound, vibration, Stop/Snooze)
- `BootReceiver.java` -- re-arms alarms after a device reboot (AlarmManager entries don't survive one)
- `TaskAlarmPlugin.java` -- Capacitor plugin bridge, exposed to JS as `window.Capacitor.Plugins.TaskAlarm`

Copy `res-layout/activity_alarm.xml` to `android/app/src/main/res/layout/activity_alarm.xml`.

## Also required (already reflected in the persisted files below, just noting why)

- `MainActivity.java` (`android-native-assets/mainactivity/`) now calls
  `registerPlugin(TaskAlarmPlugin.class);` before `super.onCreate()` -- required for Capacitor to
  expose the plugin to JS at all.
- `AndroidManifest.xml` (`android-native-assets/manifest/`) declares `AlarmActivity`,
  `AlarmReceiver`, `BootReceiver`, and the permissions this feature needs: `WAKE_LOCK`,
  `VIBRATE`, `USE_FULL_SCREEN_INTENT`, `RECEIVE_BOOT_COMPLETED`, `POST_NOTIFICATIONS`.
- `index.html` calls `nativeAlarmSchedule()` / `nativeAlarmCancel()` / `nativeAlarmReschedule()`
  (defined near `IS_NATIVE_APP`) at every point a task/subtask alarm is created, edited, or
  deleted, plus once on every app boot to reconcile/backfill anything already saved. These no-op
  safely on web.

## Real gotcha hit while building this the first time

Editing `AndroidManifest.xml` by hand re-triggered the *exact* `--` inside an XML comment bug
already documented in `docs/BUG_LOG.md` #22 -- caught immediately by the real build failing
(`SAXParseException: The string "--" is not permitted within comments`), not assumed correct.
Worth remembering before editing this file again.
