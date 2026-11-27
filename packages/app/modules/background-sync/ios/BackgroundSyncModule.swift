import BackgroundTasks
import ExpoModulesCore
import UIKit

public final class BackgroundSyncModule: Module {
  private var identifier: String?
  private var task: BGTask?
  private var graceTaskIdentifier: UIBackgroundTaskIdentifier = .invalid
  private var isDismissed = false
  private var title = ""
  private var subtitle = ""
  private let progress = Progress(totalUnitCount: 1)

  public func definition() -> ModuleDefinition {
    Name("BackgroundSync")

    Events("onExpire")

    AsyncFunction("update") { (title: String, subtitle: String, completed: Int, total: Int, forceRestart: Bool) -> Bool in
      self.title = title
      self.subtitle = subtitle

      if total > 0 {
        self.progress.totalUnitCount = Int64(total)
        self.progress.completedUnitCount = Int64(min(max(completed, 0), max(total - 1, 0)))
      } else {
        self.progress.totalUnitCount = Int64(max(completed + 1, 1))
        self.progress.completedUnitCount = Int64(max(completed, 0))
      }

      self.applyProgress()

      if forceRestart && UIApplication.shared.applicationState == .active {
        self.isDismissed = false
      }

      if self.identifier == nil && !self.isDismissed && UIApplication.shared.applicationState == .active {
        _ = self.submit(title: title, subtitle: subtitle)
        if self.task == nil {
          self.beginGraceTask()
        }
      }

      return self.hasActiveSession
    }.runOnQueue(.main)

    AsyncFunction("stop") {
      if let identifier = self.identifier, self.task == nil {
        BGTaskScheduler.shared.cancel(taskRequestWithIdentifier: identifier)
      }
      self.task?.setTaskCompleted(success: true)
      self.task = nil
      self.identifier = nil
      self.isDismissed = false
      self.endGraceTask()
    }.runOnQueue(.main)
  }

  private var hasActiveSession: Bool {
    return identifier != nil || graceTaskIdentifier != .invalid
  }

  private func submit(title: String, subtitle: String) -> Bool {
    guard #available(iOS 26.0, *), let bundleIdentifier = Bundle.main.bundleIdentifier else {
      return false
    }

    let identifier = "\(bundleIdentifier).sync.\(UUID().uuidString)"
    let isRegistered = BGTaskScheduler.shared.register(forTaskWithIdentifier: identifier, using: .main) { [weak self] task in
      guard let self, self.identifier == identifier else {
        task.setTaskCompleted(success: false)
        return
      }

      self.endGraceTask()
      self.task = task
      task.expirationHandler = { [weak self, weak task] in
        DispatchQueue.main.async {
          guard let self, let task, self.task === task else {
            return
          }

          task.setTaskCompleted(success: false)
          self.task = nil
          self.identifier = nil
          self.isDismissed = true
          self.sendEvent("onExpire")
        }
      }
      self.applyProgress()
    }

    guard isRegistered else {
      return false
    }

    let request = BGContinuedProcessingTaskRequest(identifier: identifier, title: title, subtitle: subtitle)
    request.strategy = .queue

    self.identifier = identifier
    do {
      try BGTaskScheduler.shared.submit(request)
      return true
    } catch {
      self.identifier = nil
      return false
    }
  }

  private func applyProgress() {
    guard #available(iOS 26.0, *), let task = task as? BGContinuedProcessingTask else {
      return
    }

    task.progress.totalUnitCount = progress.totalUnitCount
    task.progress.completedUnitCount = progress.completedUnitCount
    task.updateTitle(title, subtitle: subtitle)
  }

  private func beginGraceTask() {
    if graceTaskIdentifier != .invalid {
      return
    }

    graceTaskIdentifier = UIApplication.shared.beginBackgroundTask(withName: "BackgroundSync") { [weak self] in
      guard let self, self.graceTaskIdentifier != .invalid else {
        return
      }

      if let identifier = self.identifier, self.task == nil {
        BGTaskScheduler.shared.cancel(taskRequestWithIdentifier: identifier)
        self.identifier = nil
      }
      self.endGraceTask()
      self.isDismissed = true
      DispatchQueue.main.async {
        self.sendEvent("onExpire")
      }
    }
  }

  private func endGraceTask() {
    if graceTaskIdentifier == .invalid {
      return
    }

    UIApplication.shared.endBackgroundTask(graceTaskIdentifier)
    graceTaskIdentifier = .invalid
  }
}
