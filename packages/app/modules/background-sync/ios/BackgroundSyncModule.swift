import BackgroundTasks
import ExpoModulesCore
import UIKit

public final class BackgroundSyncModule: Module {
  private var continuedTask: BGTask?
  private var pendingTaskIdentifier: String?
  private var graceTaskIdentifier: UIBackgroundTaskIdentifier = .invalid
  private var completedUnitCount: Int64 = 0
  private var totalUnitCount: Int64 = 1

  public func definition() -> ModuleDefinition {
    Name("BackgroundSync")

    Events("onExpire")

    AsyncFunction("begin") { (title: String, subtitle: String) -> Bool in
      self.finish(success: true)
      self.completedUnitCount = 0
      self.totalUnitCount = 1

      if self.submitContinuedTask(title: title, subtitle: subtitle) {
        return true
      }

      self.beginGraceTask()

      return false
    }.runOnQueue(.main)

    AsyncFunction("setProgress") { (completed: Int, total: Int) in
      self.completedUnitCount = Int64(max(completed, 0))
      self.totalUnitCount = Int64(max(total, completed, 1))
      self.applyProgress()
    }.runOnQueue(.main)

    AsyncFunction("end") { (success: Bool) in
      self.finish(success: success)
    }.runOnQueue(.main)
  }

  private func submitContinuedTask(title: String, subtitle: String) -> Bool {
    guard #available(iOS 26.0, *) else {
      return false
    }

    guard let bundleIdentifier = Bundle.main.bundleIdentifier else {
      return false
    }

    let identifier = "\(bundleIdentifier).sync.\(UUID().uuidString)"
    let isRegistered = BGTaskScheduler.shared.register(forTaskWithIdentifier: identifier, using: .main) { [weak self] task in
      guard let self else {
        task.setTaskCompleted(success: false)
        return
      }

      self.attach(task: task, identifier: identifier)
    }

    guard isRegistered else {
      return false
    }

    let request = BGContinuedProcessingTaskRequest(identifier: identifier, title: title, subtitle: subtitle)
    request.strategy = .fail

    guard (try? BGTaskScheduler.shared.submit(request)) != nil else {
      return false
    }

    pendingTaskIdentifier = identifier

    return true
  }

  private func attach(task: BGTask, identifier: String) {
    guard pendingTaskIdentifier == identifier else {
      task.setTaskCompleted(success: false)
      return
    }

    pendingTaskIdentifier = nil
    continuedTask = task
    task.expirationHandler = { [weak self, weak task] in
      DispatchQueue.main.async {
        guard let self, let task else {
          return
        }

        self.expire(task: task)
      }
    }
    applyProgress()
  }

  private func applyProgress() {
    guard #available(iOS 26.0, *), let task = continuedTask as? BGContinuedProcessingTask else {
      return
    }

    task.progress.totalUnitCount = totalUnitCount
    task.progress.completedUnitCount = completedUnitCount
  }

  private func expire(task: BGTask) {
    guard continuedTask === task else {
      return
    }

    continuedTask = nil
    task.setTaskCompleted(success: false)
    sendEvent("onExpire")
  }

  private func beginGraceTask() {
    graceTaskIdentifier = UIApplication.shared.beginBackgroundTask(withName: "BackgroundSync") { [weak self] in
      guard let self else {
        return
      }

      self.endGraceTask()
      self.sendEvent("onExpire")
    }
  }

  private func endGraceTask() {
    guard graceTaskIdentifier != .invalid else {
      return
    }

    UIApplication.shared.endBackgroundTask(graceTaskIdentifier)
    graceTaskIdentifier = .invalid
  }

  private func finish(success: Bool) {
    if let pendingTaskIdentifier {
      BGTaskScheduler.shared.cancel(taskRequestWithIdentifier: pendingTaskIdentifier)
      self.pendingTaskIdentifier = nil
    }

    continuedTask?.setTaskCompleted(success: success)
    continuedTask = nil
    endGraceTask()
  }
}
