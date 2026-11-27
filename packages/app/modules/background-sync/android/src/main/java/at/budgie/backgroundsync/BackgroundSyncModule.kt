package at.budgie.backgroundsync

import android.content.Context
import android.content.Intent
import androidx.core.content.ContextCompat
import expo.modules.kotlin.exception.Exceptions
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

class BackgroundSyncModule : Module() {
  private val context: Context
    get() = appContext.reactContext ?: throw Exceptions.ReactContextLost()

  @Volatile
  private var isForeground = false

  @Volatile
  private var isDismissed = false

  override fun definition() = ModuleDefinition {
    Name("BackgroundSync")

    Events("onExpire")

    OnCreate {
      isForeground = appContext.currentActivity != null
      BackgroundSyncSessionBridge.onExpire = {
        isDismissed = true
        sendEvent("onExpire")
      }
    }

    OnDestroy {
      BackgroundSyncSessionBridge.onExpire = null
    }

    OnActivityEntersForeground {
      isForeground = true
    }

    OnActivityEntersBackground {
      isForeground = false
    }

    AsyncFunction("update") { title: String, subtitle: String, completed: Int, total: Int, forceRestart: Boolean ->
      if (forceRestart && isForeground) {
        isDismissed = false
      }

      if (BackgroundSyncSessionBridge.isRunning.get()) {
        BackgroundSyncForegroundService.updateNotification(context, title, subtitle, completed, total)
        return@AsyncFunction true
      }

      if (!isDismissed && isForeground) {
        val token = BackgroundSyncSessionBridge.sessionToken.incrementAndGet()
        val intent = Intent(context, BackgroundSyncForegroundService::class.java).apply {
          action = BackgroundSyncForegroundService.ACTION_START_OR_UPDATE
          putExtra(BackgroundSyncForegroundService.EXTRA_SESSION_TOKEN, token)
          putExtra(BackgroundSyncForegroundService.EXTRA_TITLE, title)
          putExtra(BackgroundSyncForegroundService.EXTRA_SUBTITLE, subtitle)
          putExtra(BackgroundSyncForegroundService.EXTRA_COMPLETED, completed)
          putExtra(BackgroundSyncForegroundService.EXTRA_TOTAL, total)
        }

        return@AsyncFunction try {
          BackgroundSyncSessionBridge.pendingStop.set(false)
          BackgroundSyncSessionBridge.isForegroundStarted.set(false)
          BackgroundSyncSessionBridge.isRunning.set(true)
          ContextCompat.startForegroundService(context, intent)
          true
        } catch (_: Exception) {
          if (BackgroundSyncSessionBridge.sessionToken.get() == token) {
            BackgroundSyncSessionBridge.isRunning.set(false)
          }
          false
        }
      }

      false
    }

    AsyncFunction("stop") {
      isDismissed = false
      BackgroundSyncSessionBridge.sessionToken.incrementAndGet()
      if (BackgroundSyncSessionBridge.isRunning.getAndSet(false)) {
        if (BackgroundSyncSessionBridge.isForegroundStarted.get()) {
          context.stopService(Intent(context, BackgroundSyncForegroundService::class.java))
        } else {
          BackgroundSyncSessionBridge.pendingStop.set(true)
        }
      }
    }
  }
}
