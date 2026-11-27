package at.budgie.backgroundsync

import java.util.concurrent.atomic.AtomicBoolean
import java.util.concurrent.atomic.AtomicLong

object BackgroundSyncSessionBridge {
  val sessionToken = AtomicLong(0)
  val isRunning = AtomicBoolean(false)
  val isForegroundStarted = AtomicBoolean(false)

  @Volatile
  var onExpire: (() -> Unit)? = null

  @Volatile
  var onSessionEnded: (() -> Unit)? = null

  fun notifyExpired(token: Long) {
    if (token != 0L && sessionToken.get() == token && isRunning.getAndSet(false)) {
      isForegroundStarted.set(false)
      onSessionEnded?.invoke()
      onExpire?.invoke()
    }
  }
}
