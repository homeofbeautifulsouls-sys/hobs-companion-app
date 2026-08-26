package com.hobsfoundation.companion;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;

// AlarmManager entries are wiped on every reboot -- this re-arms whatever this device still
// remembers scheduling (see AlarmScheduler's SharedPreferences bookkeeping), so an alarm set
// for tomorrow morning still rings even if the phone gets restarted overnight.
public class BootReceiver extends BroadcastReceiver {
  @Override
  public void onReceive(Context context, Intent intent) {
    if (Intent.ACTION_BOOT_COMPLETED.equals(intent.getAction())) {
      AlarmScheduler.rescheduleAllAfterBoot(context);
    }
  }
}
