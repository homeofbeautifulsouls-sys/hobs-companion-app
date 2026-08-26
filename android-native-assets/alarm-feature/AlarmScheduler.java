package com.hobsfoundation.companion;

import android.app.AlarmManager;
import android.app.PendingIntent;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.util.Log;

import java.util.HashSet;
import java.util.Set;

// Central place for scheduling/cancelling real, native alarms and for remembering what's
// currently scheduled so they can be re-armed after a device reboot (AlarmManager entries do
// not survive a reboot on their own -- RECEIVE_BOOT_COMPLETED + this bookkeeping is required).
// Uses AlarmManager.setAlarmClock() specifically, not setExactAndAllowWhileIdle(): this is the
// one API that behaves exactly like a real alarm-clock alarm -- shows the little alarm icon in
// the status bar, is exempt from Doze/battery-optimization deferral, and (unlike
// SCHEDULE_EXACT_ALARM/USE_EXACT_ALARM) requires no special runtime permission at all, which
// matters since this app has no reason to ask for that broader permission for anything else.
public class AlarmScheduler {
  private static final String TAG = "HobsAlarmScheduler";
  private static final String PREFS_NAME = "hobs_task_alarms";

  public static void schedule(Context ctx, String id, String title, long atMillis) {
    AlarmManager am = (AlarmManager) ctx.getSystemService(Context.ALARM_SERVICE);
    if (am == null) { Log.e(TAG, "AlarmManager unavailable"); return; }

    Intent intent = new Intent(ctx, AlarmReceiver.class);
    intent.putExtra("id", id);
    intent.putExtra("title", title);
    PendingIntent operation = PendingIntent.getBroadcast(
      ctx, pendingIntentRequestCode(id), intent,
      PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
    );

    // The "show intent" is what fires if the user taps the status-bar alarm icon itself --
    // reuses the same full-screen alarm activity rather than a separate summary screen.
    Intent showIntent = new Intent(ctx, AlarmActivity.class);
    showIntent.putExtra("id", id);
    showIntent.putExtra("title", title);
    showIntent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP);
    PendingIntent showPI = PendingIntent.getActivity(
      ctx, pendingIntentRequestCode(id) + 1, showIntent,
      PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
    );

    am.setAlarmClock(new AlarmManager.AlarmClockInfo(atMillis, showPI), operation);
    rememberAlarm(ctx, id, title, atMillis);
    Log.i(TAG, "Scheduled alarm " + id + " at " + atMillis);
  }

  public static void cancel(Context ctx, String id) {
    AlarmManager am = (AlarmManager) ctx.getSystemService(Context.ALARM_SERVICE);
    Intent intent = new Intent(ctx, AlarmReceiver.class);
    PendingIntent operation = PendingIntent.getBroadcast(
      ctx, pendingIntentRequestCode(id), intent,
      PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
    );
    if (am != null) am.cancel(operation);
    forgetAlarm(ctx, id);
    Log.i(TAG, "Cancelled alarm " + id);
  }

  // Re-arms every alarm this device knows about that's still in the future. Called from
  // BootReceiver. Anything already in the past when the reboot happens is deliberately dropped,
  // not fired late -- a missed task alarm ringing at a random later moment would be worse than
  // just not ringing at all.
  public static void rescheduleAllAfterBoot(Context ctx) {
    SharedPreferences prefs = ctx.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);
    Set<String> ids = new HashSet<>(prefs.getStringSet("ids", new HashSet<String>()));
    long now = System.currentTimeMillis();
    for (String id : ids) {
      long atMillis = prefs.getLong("at_" + id, -1);
      String title = prefs.getString("title_" + id, "Task alarm");
      if (atMillis > now) {
        schedule(ctx, id, title, atMillis);
      } else {
        forgetAlarm(ctx, id);
      }
    }
  }

  private static void rememberAlarm(Context ctx, String id, String title, long atMillis) {
    SharedPreferences prefs = ctx.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);
    Set<String> ids = new HashSet<>(prefs.getStringSet("ids", new HashSet<String>()));
    ids.add(id);
    prefs.edit()
      .putStringSet("ids", ids)
      .putLong("at_" + id, atMillis)
      .putString("title_" + id, title)
      .apply();
  }

  private static void forgetAlarm(Context ctx, String id) {
    SharedPreferences prefs = ctx.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);
    Set<String> ids = new HashSet<>(prefs.getStringSet("ids", new HashSet<String>()));
    ids.remove(id);
    prefs.edit()
      .putStringSet("ids", ids)
      .remove("at_" + id)
      .remove("title_" + id)
      .apply();
  }

  // AlarmManager needs a stable int request code per alarm id so re-scheduling the same id
  // (e.g. editing a task's alarm time) replaces the existing PendingIntent instead of stacking a
  // second one. Task/subtask ids are real UUIDs (or temp_ prefixed client ids), so hash them.
  private static int pendingIntentRequestCode(String id) {
    return id.hashCode();
  }
}
