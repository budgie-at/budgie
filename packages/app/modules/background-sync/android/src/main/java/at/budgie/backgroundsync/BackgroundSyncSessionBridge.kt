package at.budgie.backgroundsync

import java.util.concurrent.atomic.AtomicBoolean

object BackgroundSyncSessionBridge {
  val isRunning = AtomicBoolean(false)
  val isForegroundStarted = AtomicBoolean(false)
  val pendingStop = AtomicBoolean(false)

  @Volatile
  var onExpire: (() -> Unit)? = null

  fun notifyExpired() {
    isRunning.set(false)
    onExpire?.invoke()
  }
}
