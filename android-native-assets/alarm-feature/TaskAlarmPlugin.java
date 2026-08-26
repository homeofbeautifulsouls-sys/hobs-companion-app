package com.hobsfoundation.companion;

import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

// Bridges index.html's existing task/subtask alarm fields to a real, native Android alarm.
// Exposed to JS as window.Capacitor.Plugins.TaskAlarm.
@CapacitorPlugin(name = "TaskAlarm")
public class TaskAlarmPlugin extends Plugin {

  @PluginMethod
  public void schedule(PluginCall call) {
    String id = call.getString("id");
    String title = call.getString("title");
    Long atMillis = call.getLong("atMillis");
    if (id == null || atMillis == null) {
      call.reject("id and atMillis are required");
      return;
    }
    AlarmScheduler.schedule(getContext(), id, title != null ? title : "Task alarm", atMillis);
    call.resolve();
  }

  @PluginMethod
  public void cancel(PluginCall call) {
    String id = call.getString("id");
    if (id == null) {
      call.reject("id is required");
      return;
    }
    AlarmScheduler.cancel(getContext(), id);
    call.resolve();
  }
}
