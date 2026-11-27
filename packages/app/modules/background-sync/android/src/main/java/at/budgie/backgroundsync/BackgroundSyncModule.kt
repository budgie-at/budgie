package at.budgie.backgroundsync

import android.content.Context
import android.content.Intent
import androidx.core.content.ContextCompat
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.ReactContext
import com.facebook.react.bridge.UiThreadUtil
import com.facebook.react.jstasks.HeadlessJsTaskConfig
import com.facebook.react.jstasks.HeadlessJsTaskContext
import expo.modules.kotlin.exception.Exceptions
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

class BackgroundSyncModule : Module() {
  private val context: Context
    get() = appContext.reactContext ?: throw Exceptions.ReactContextLost()

  private val keepAliveLock = Any()
  private var keepAliveRefCount = 0
  private var sessionKeepAliveHeld = false
  private var headlessTaskId: Int? = null

  @Volatile
  private var isForeground = false

  @Volatile
  private var isDismissed = false

  override fun definition() = ModuleDefinition {
    Name("BackgroundSync")

    Events("onExpire")

    OnCreate {
      isForeground = appContext.currentActivity != null
      BackgroundSyncSessionBridge.onSessionEnded = {
        releaseSessionKeepAlive()
      }
      BackgroundSyncSessionBridge.onExpire = {
        isDismissed = true
        sendEvent("onExpire")
      }
    }

    OnDestroy {
      BackgroundSyncSessionBridge.onSessionEnded = null
      BackgroundSyncSessionBridge.onExpire = null
      synchronized(keepAliveLock) {
        keepAliveRefCount = 0
        sessionKeepAliveHeld = false
      }
      stopHeadlessKeepAlive()
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
          putExtra(BackgroundSyncForegroundService.EXTRA_SESSION_TOKEN, token)
          putExtra(BackgroundSyncForegroundService.EXTRA_TITLE, title)
          putExtra(BackgroundSyncForegroundService.EXTRA_SUBTITLE, subtitle)
          putExtra(BackgroundSyncForegroundService.EXTRA_COMPLETED, completed)
          putExtra(BackgroundSyncForegroundService.EXTRA_TOTAL, total)
        }

        return@AsyncFunction try {
          BackgroundSyncSessionBridge.isForegroundStarted.set(false)
          BackgroundSyncSessionBridge.isRunning.set(true)
          acquireSessionKeepAlive()
          ContextCompat.startForegroundService(context, intent)
          true
        } catch (_: Exception) {
          if (BackgroundSyncSessionBridge.sessionToken.get() == token) {
            BackgroundSyncSessionBridge.isRunning.set(false)
            releaseSessionKeepAlive()
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
        releaseSessionKeepAlive()
        if (BackgroundSyncSessionBridge.isForegroundStarted.get()) {
          context.stopService(Intent(context, BackgroundSyncForegroundService::class.java))
        }
      }
    }

    AsyncFunction("acquireTimerKeepAlive") {
      acquireKeepAlive()
    }

    AsyncFunction("releaseTimerKeepAlive") {
      releaseKeepAlive()
    }
  }

  private fun acquireSessionKeepAlive() {
    val shouldAcquire: Boolean
    synchronized(keepAliveLock) {
      shouldAcquire = !sessionKeepAliveHeld
      sessionKeepAliveHeld = true
    }
    if (shouldAcquire) {
      acquireKeepAlive()
    }
  }

  private fun releaseSessionKeepAlive() {
    val shouldRelease: Boolean
    synchronized(keepAliveLock) {
      shouldRelease = sessionKeepAliveHeld
      sessionKeepAliveHeld = false
    }
    if (shouldRelease) {
      releaseKeepAlive()
    }
  }

  private fun acquireKeepAlive() {
    val shouldStart: Boolean
    synchronized(keepAliveLock) {
      keepAliveRefCount += 1
      shouldStart = keepAliveRefCount == 1
    }
    if (shouldStart) {
      startHeadlessKeepAlive()
    }
  }

  private fun releaseKeepAlive() {
    val shouldStop: Boolean
    synchronized(keepAliveLock) {
      if (keepAliveRefCount == 0) {
        return
      }
      keepAliveRefCount -= 1
      shouldStop = keepAliveRefCount == 0
    }
    if (shouldStop) {
      stopHeadlessKeepAlive()
    }
  }

  private fun startHeadlessKeepAlive() {
    val reactContext = appContext.reactContext as? ReactContext ?: return
    UiThreadUtil.runOnUiThread {
      val shouldStart = synchronized(keepAliveLock) { keepAliveRefCount > 0 && headlessTaskId == null }
      if (!shouldStart) {
        return@runOnUiThread
      }
      try {
        val config = HeadlessJsTaskConfig(
          KEEP_ALIVE_HEADLESS_TASK,
          Arguments.createMap(),
          0,
          true
        )
        val taskId = HeadlessJsTaskContext.getInstance(reactContext).startTask(config)
        val stillNeeded = synchronized(keepAliveLock) {
          if (keepAliveRefCount > 0) {
            headlessTaskId = taskId
            true
          } else {
            false
          }
        }
        if (!stillNeeded) {
          HeadlessJsTaskContext.getInstance(reactContext).finishTask(taskId)
        }
      } catch (_: Exception) {
      }
    }
  }

  private fun stopHeadlessKeepAlive() {
    val reactContext = appContext.reactContext as? ReactContext ?: return
    UiThreadUtil.runOnUiThread {
      val taskId = synchronized(keepAliveLock) {
        if (keepAliveRefCount == 0) {
          val current = headlessTaskId
          headlessTaskId = null
          current
        } else {
          null
        }
      } ?: return@runOnUiThread
      try {
        HeadlessJsTaskContext.getInstance(reactContext).finishTask(taskId)
      } catch (_: Exception) {
      }
    }
  }

  companion object {
    private const val KEEP_ALIVE_HEADLESS_TASK = "budgie-background-sync-keep-alive"
  }
}
