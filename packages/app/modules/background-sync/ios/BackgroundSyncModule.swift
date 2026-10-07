import BackgroundTasks
import ExpoModulesCore
import UIKit

public final class BackgroundSyncModule: Module {
  private var identifier: String?
  private var task: BGTask?
  private let progress = Progress(totalUnitCount: 1)

  public func definition() -> ModuleDefinition {
    Name("BackgroundSync")

    AsyncFunction("update") { (title: String, subtitle: String, completed: Int, total: Int) in
      self.progress.totalUnitCount = Int64(max(total, completed, 1))
      self.progress.completedUnitCount = Int64(completed)
      self.applyProgress()

      if self.identifier == nil, UIApplication.shared.applicationState == .active {
        self.submit(title: title, subtitle: subtitle)
      }
    }.runOnQueue(.main)

    AsyncFunction("stop") {
      if let identifier = self.identifier, self.task == nil {
        BGTaskScheduler.shared.cancel(taskRequestWithIdentifier: identifier)
      }
      self.task?.setTaskCompleted(success: true)
      self.task = nil
      self.identifier = nil
    }.runOnQueue(.main)
  }

  private func submit(title: String, subtitle: String) {
    guard #available(iOS 26.0, *), let bundleIdentifier = Bundle.main.bundleIdentifier else {
      return
    }

    let identifier = "\(bundleIdentifier).sync.\(UUID().uuidString)"
    let isRegistered = BGTaskScheduler.shared.register(forTaskWithIdentifier: identifier, using: .main) { [weak self] task in
      guard let self, self.identifier == identifier else {
        task.setTaskCompleted(success: false)
        return
      }

      self.task = task
      task.expirationHandler = { [weak self] in
        task.setTaskCompleted(success: false)
        self?.task = nil
        self?.identifier = nil
      }
      self.applyProgress()
    }
    let request = BGContinuedProcessingTaskRequest(identifier: identifier, title: title, subtitle: subtitle)
    request.strategy = .fail

    if isRegistered, (try? BGTaskScheduler.shared.submit(request)) != nil {
      self.identifier = identifier
    }
  }

  private func applyProgress() {
    guard #available(iOS 26.0, *), let task = task as? BGContinuedProcessingTask else {
      return
    }

    task.progress.totalUnitCount = progress.totalUnitCount
    task.progress.completedUnitCount = progress.completedUnitCount
  }
}
