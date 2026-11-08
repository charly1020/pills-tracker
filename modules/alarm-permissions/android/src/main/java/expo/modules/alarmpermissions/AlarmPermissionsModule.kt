package expo.modules.alarmpermissions

import android.app.NotificationChannel
import android.app.NotificationManager
import android.content.ActivityNotFoundException
import android.content.Context
import android.content.Intent
import android.media.AudioAttributes
import android.media.RingtoneManager
import android.net.Uri
import android.os.Build
import android.provider.Settings
import expo.modules.kotlin.exception.Exceptions
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

class AlarmPermissionsModule : Module() {
  private val context: Context
    get() = appContext.reactContext ?: throw Exceptions.ReactContextLost()

  override fun definition() = ModuleDefinition {
    Name("AlarmPermissions")

    // Android 14+ lets the user revoke full-screen notifications; earlier versions always allow them.
    Function("canUseFullScreenIntent") {
      if (Build.VERSION.SDK_INT < 34) return@Function true
      val manager = context.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
      manager.canUseFullScreenIntent()
    }

    // Creates the alarm notification channel with the ALARM audio usage, so the sound plays on the alarm
    // volume and is not muted by vibrate mode or a zero notification volume. Android ignores a repeat
    // call for an id that already exists, so a changed setting needs a new id.
    Function("createAlarmChannel") { id: String, name: String ->
      val manager = context.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
      val sound = RingtoneManager.getDefaultUri(RingtoneManager.TYPE_ALARM)
        ?: RingtoneManager.getDefaultUri(RingtoneManager.TYPE_NOTIFICATION)
      val attributes = AudioAttributes.Builder()
        .setUsage(AudioAttributes.USAGE_ALARM)
        .setContentType(AudioAttributes.CONTENT_TYPE_SONIFICATION)
        .build()
      val channel = NotificationChannel(id, name, NotificationManager.IMPORTANCE_HIGH).apply {
        setSound(sound, attributes)
        enableVibration(true)
        vibrationPattern = longArrayOf(0, 600, 400, 600, 400, 600)
        setBypassDnd(true)
        setShowBadge(false)
        lockscreenVisibility = android.app.Notification.VISIBILITY_PUBLIC
      }
      manager.createNotificationChannel(channel)
    }

    // Opens this app's "full-screen notifications" switch (falls back to the app details page).
    Function("openFullScreenIntentSettings") {
      val uri = Uri.parse("package:${context.packageName}")
      val primary =
        if (Build.VERSION.SDK_INT >= 34) Intent(Settings.ACTION_MANAGE_APP_USE_FULL_SCREEN_INTENT, uri)
        else Intent(Settings.ACTION_APPLICATION_DETAILS_SETTINGS, uri)
      try {
        context.startActivity(primary.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK))
      } catch (e: ActivityNotFoundException) {
        context.startActivity(
          Intent(Settings.ACTION_APPLICATION_DETAILS_SETTINGS, uri).addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
        )
      }
    }
  }
}
