package com.hobsfoundation.companion;

import android.app.KeyguardManager;
import android.content.Context;
import android.media.AudioAttributes;
import android.media.MediaPlayer;
import android.media.RingtoneManager;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.os.VibrationEffect;
import android.os.Vibrator;
import android.view.WindowManager;
import android.widget.Button;
import android.widget.TextView;
import androidx.appcompat.app.AppCompatActivity;

// The real, ringing alarm screen -- this is the part a plain push notification could never do.
// Shows directly over the lock screen, plays a genuinely looping alarm sound (not a one-shot
// notification chime), vibrates in a repeating pattern, and only stops for a real Stop or Snooze
// tap -- not for a swipe-away, matching how every real alarm clock app behaves.
public class AlarmActivity extends AppCompatActivity {
  private MediaPlayer mediaPlayer;
  private Vibrator vibrator;
  private String alarmId;

  @Override
  protected void onCreate(Bundle savedInstanceState) {
    super.onCreate(savedInstanceState);

    // Show over the lock screen and turn the actual screen on -- the modern (API 27+) way, with
    // a fallback for older devices via legacy window flags. Both are set; harmless to set both.
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O_MR1) {
      setShowWhenLocked(true);
      setTurnScreenOn(true);
      KeyguardManager km = (KeyguardManager) getSystemService(Context.KEYGUARD_SERVICE);
      if (km != null) km.requestDismissKeyguard(this, null);
    }
    getWindow().addFlags(
      WindowManager.LayoutParams.FLAG_SHOW_WHEN_LOCKED |
      WindowManager.LayoutParams.FLAG_DISMISS_KEYGUARD |
      WindowManager.LayoutParams.FLAG_TURN_SCREEN_ON |
      WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON
    );

    setContentView(R.layout.activity_alarm);

    alarmId = getIntent().getStringExtra("id");
    String title = getIntent().getStringExtra("title");
    TextView titleView = findViewById(R.id.alarmTitleText);
    titleView.setText(title != null && !title.isEmpty() ? title : "Task alarm");

    startRinging();
    startVibrating();

    Button stopBtn = findViewById(R.id.alarmStopBtn);
    Button snoozeBtn = findViewById(R.id.alarmSnoozeBtn);
    stopBtn.setOnClickListener(v -> { stopAlarmMedia(); finish(); });
    snoozeBtn.setOnClickListener(v -> {
      stopAlarmMedia();
      long snoozeAt = System.currentTimeMillis() + (9 * 60 * 1000); // real alarm-clock apps snooze 9-10 min; matching that convention
      AlarmScheduler.schedule(getApplicationContext(), alarmId, title, snoozeAt);
      finish();
    });
  }

  private void startRinging() {
    try {
      Uri alarmSoundUri = RingtoneManager.getActualDefaultRingtoneUri(this, RingtoneManager.TYPE_ALARM);
      if (alarmSoundUri == null) {
        // Some devices/emulators genuinely have no default alarm sound set -- fall back to the
        // notification sound rather than ringing silently, which would defeat the entire feature.
        alarmSoundUri = RingtoneManager.getDefaultUri(RingtoneManager.TYPE_NOTIFICATION);
      }
      mediaPlayer = new MediaPlayer();
      mediaPlayer.setAudioAttributes(
        new AudioAttributes.Builder()
          .setUsage(AudioAttributes.USAGE_ALARM)
          .setContentType(AudioAttributes.CONTENT_TYPE_SONIFICATION)
          .build()
      );
      mediaPlayer.setDataSource(this, alarmSoundUri);
      mediaPlayer.setLooping(true);
      mediaPlayer.prepare();
      mediaPlayer.start();
    } catch (Exception e) {
      // A sound failure shouldn't take down the whole alarm screen -- vibration still fires,
      // and Stop/Snooze still work either way.
    }
  }

  private void startVibrating() {
    vibrator = (Vibrator) getSystemService(Context.VIBRATOR_SERVICE);
    if (vibrator == null || !vibrator.hasVibrator()) return;
    long[] pattern = {0, 800, 500}; // wait, buzz, pause -- repeating
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
      vibrator.vibrate(VibrationEffect.createWaveform(pattern, 1)); // repeat from index 1
    } else {
      vibrator.vibrate(pattern, 1);
    }
  }

  private void stopAlarmMedia() {
    if (mediaPlayer != null) {
      try { if (mediaPlayer.isPlaying()) mediaPlayer.stop(); mediaPlayer.release(); } catch (Exception ignored) {}
      mediaPlayer = null;
    }
    if (vibrator != null) vibrator.cancel();
  }

  @Override
  public void onBackPressed() {
    // Deliberate: a real alarm clock doesn't let the back button silently dismiss it --
    // only a genuine Stop or Snooze tap should end it.
  }

  @Override
  protected void onDestroy() {
    super.onDestroy();
    stopAlarmMedia();
  }
}
