package at.budgie.backgroundsync

import java.util.concurrent.atomic.AtomicBoolean
import java.util.concurrent.atomic.AtomicLong

object BackgroundSyncSessionBridge {
  val sessionToken = AtomicLong(0)
  val isRunning = AtomicBoolean(false)
  val isForegroundStarted = AtomicBoolean(false)
  val pendingStop = AtomicBoolean(false)

  @Volatile
  var onExpire: (() -> Unit)? = null

  fun notifyExpired(token: Long) {
    if (sessionToken.get() == token && isRunning.getAndSet(false)) {
      onExpire?.invoke()
    }
  }
}
