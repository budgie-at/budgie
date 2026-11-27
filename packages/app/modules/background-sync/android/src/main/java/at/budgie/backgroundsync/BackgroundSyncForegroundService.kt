package at.budgie.backgroundsync

import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.app.Service
import android.content.Context
import android.content.Intent
import android.content.pm.ServiceInfo
import android.os.Build
import android.os.IBinder
import androidx.core.app.NotificationCompat
import androidx.core.app.ServiceCompat

class BackgroundSyncForegroundService : Service() {
  private var activeToken = 0L

  override fun onBind(intent: Intent?): IBinder? = null

  override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
    val token = intent?.getLongExtra(EXTRA_SESSION_TOKEN, 0L) ?: 0L
    val title = intent?.getStringExtra(EXTRA_TITLE).orEmpty()
    val subtitle = intent?.getStringExtra(EXTRA_SUBTITLE).orEmpty()
    val completed = intent?.getIntExtra(EXTRA_COMPLETED, 0) ?: 0
    val total = intent?.getIntExtra(EXTRA_TOTAL, 0) ?: 0

    ensureNotificationChannel(this)
    val notification = buildNotification(this, title, subtitle, completed, total)
    val foregroundServiceType = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
      ServiceInfo.FOREGROUND_SERVICE_TYPE_DATA_SYNC
    } else {
      0
    }

    ServiceCompat.startForeground(this, NOTIFICATION_ID, notification, foregroundServiceType)

    if (token != BackgroundSyncSessionBridge.sessionToken.get()) {
      if (!BackgroundSyncSessionBridge.isRunning.get()) {
        stopForegroundAndSelf(expired = false, token = token, startId = startId)
      }
      return START_NOT_STICKY
    }

    if (
      intent?.action == ACTION_STOP ||
        BackgroundSyncSessionBridge.pendingStop.getAndSet(false) ||
        !BackgroundSyncSessionBridge.isRunning.get()
    ) {
      stopForegroundAndSelf(expired = false, token = token, startId = startId)
      return START_NOT_STICKY
    }

    activeToken = token
    BackgroundSyncSessionBridge.isForegroundStarted.set(true)

    return START_NOT_STICKY
  }

  override fun onTimeout(startId: Int) {
    stopForegroundAndSelf(expired = true, token = activeToken, startId = null)
  }

  override fun onTimeout(startId: Int, fgsType: Int) {
    stopForegroundAndSelf(expired = true, token = activeToken, startId = null)
  }

  override fun onDestroy() {
    if (activeToken != 0L && BackgroundSyncSessionBridge.sessionToken.get() == activeToken) {
      BackgroundSyncSessionBridge.isRunning.set(false)
      BackgroundSyncSessionBridge.isForegroundStarted.set(false)
      BackgroundSyncSessionBridge.pendingStop.set(false)
    }
    super.onDestroy()
  }

  private fun stopForegroundAndSelf(expired: Boolean, token: Long, startId: Int?) {
    if (expired) {
      BackgroundSyncSessionBridge.notifyExpired(token)
    } else if (token != 0L && BackgroundSyncSessionBridge.sessionToken.get() == token) {
      BackgroundSyncSessionBridge.isRunning.set(false)
    }

    ServiceCompat.stopForeground(this, ServiceCompat.STOP_FOREGROUND_REMOVE)
    if (startId != null) {
      stopSelf(startId)
    } else {
      stopSelf()
    }
  }

  companion object {
    const val CHANNEL_ID = "budgie-background-sync"
    private const val CHANNEL_NAME = "Background sync"
    const val NOTIFICATION_ID = 48219
    const val ACTION_START_OR_UPDATE = "at.budgie.backgroundsync.ACTION_START_OR_UPDATE"
    const val ACTION_STOP = "at.budgie.backgroundsync.ACTION_STOP"
    const val EXTRA_SESSION_TOKEN = "sessionToken"
    const val EXTRA_TITLE = "title"
    const val EXTRA_SUBTITLE = "subtitle"
    const val EXTRA_COMPLETED = "completed"
    const val EXTRA_TOTAL = "total"

    fun updateNotification(
      context: Context,
      title: String,
      subtitle: String,
      completed: Int,
      total: Int
    ) {
      ensureNotificationChannel(context)
      val manager = context.getSystemService(NotificationManager::class.java) ?: return
      manager.notify(
        NOTIFICATION_ID,
        buildNotification(context, title, subtitle, completed, total)
      )
    }

    private fun ensureNotificationChannel(context: Context) {
      if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
        val manager = context.getSystemService(NotificationManager::class.java) ?: return
        if (manager.getNotificationChannel(CHANNEL_ID) == null) {
          val channel = NotificationChannel(
            CHANNEL_ID,
            CHANNEL_NAME,
            NotificationManager.IMPORTANCE_LOW
          ).apply {
            setShowBadge(false)
          }
          manager.createNotificationChannel(channel)
        }
      }
    }

    private fun buildNotification(
      context: Context,
      title: String,
      subtitle: String,
      completed: Int,
      total: Int
    ): Notification {
      val notificationIcon = context.resources.getIdentifier("notification_icon", "drawable", context.packageName)
      val icon = if (notificationIcon != 0) {
        notificationIcon
      } else {
        android.R.drawable.stat_notify_sync
      }

      val builder = NotificationCompat.Builder(context, CHANNEL_ID)
        .setSmallIcon(icon)
        .setContentTitle(title)
        .setContentText(subtitle)
        .setOngoing(true)
        .setOnlyAlertOnce(true)
        .setSilent(true)
        .setPriority(NotificationCompat.PRIORITY_LOW)
        .setCategory(NotificationCompat.CATEGORY_PROGRESS)

      if (total > 0) {
        builder.setProgress(total, completed.coerceIn(0, total), false)
      } else {
        builder.setProgress(0, 0, true)
      }

      val launchIntent = context.packageManager.getLaunchIntentForPackage(context.packageName)
      if (launchIntent != null) {
        val pendingIntent = PendingIntent.getActivity(
          context,
          0,
          launchIntent,
          PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )
        builder.setContentIntent(pendingIntent)
      }

      return builder.build()
    }
  }
}
