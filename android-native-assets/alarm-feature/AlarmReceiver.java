package com.hobsfoundation.companion;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.os.PowerManager;
import android.util.Log;

// Fires when AlarmManager's scheduled time arrives. Briefly holds a wake lock just long enough
// to reliably launch the full-screen alarm activity even from a fully asleep/locked device --
// without this, starting an Activity from a background BroadcastReceiver on a sleeping device
// can be delayed or dropped by the OS before the screen is confirmed awake.
public class AlarmReceiver extends BroadcastReceiver {
  private static final String TAG = "HobsAlarmReceiver";

  @Override
  public void onReceive(Context context, Intent intent) {
    String id = intent.getStringExtra("id");
    String title = intent.getStringExtra("title");
    Log.i(TAG, "Alarm fired for " + id);

    PowerManager pm = (PowerManager) context.getSystemService(Context.POWER_SERVICE);
    PowerManager.WakeLock wakeLock = null;
    if (pm != null) {
      wakeLock = pm.newWakeLock(
        PowerManager.FULL_WAKE_LOCK | PowerManager.ACQUIRE_CAUSES_WAKEUP | PowerManager.ON_AFTER_RELEASE,
        "HobsCompanion:AlarmWakeLock"
      );
      wakeLock.acquire(10000); // 10s is plenty to hand off to AlarmActivity, which takes over from here
    }

    Intent activityIntent = new Intent(context, AlarmActivity.class);
    activityIntent.putExtra("id", id);
    activityIntent.putExtra("title", title);
    activityIntent.setFlags(
      Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP | Intent.FLAG_ACTIVITY_SINGLE_TOP
    );
    context.startActivity(activityIntent);

    if (wakeLock != null && wakeLock.isHeld()) wakeLock.release();
  }
}
