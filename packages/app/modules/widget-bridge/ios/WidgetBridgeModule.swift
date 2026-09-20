import ExpoModulesCore
import WidgetKit

public final class WidgetBridgeModule: Module {
    private static let appGroupInfoKey = "BudgieAppGroup"
    private static let snapshotName = "snapshot.json"

    public func definition() -> ModuleDefinition {
        Name("WidgetBridge")

        Function("isAvailable") { () -> Bool in
            Self.containerURL() != nil
        }

        AsyncFunction("publish") { (json: String) -> Bool in
            guard let container = Self.containerURL() else {
                return false
            }

            try Data(json.utf8).write(to: container.appendingPathComponent(Self.snapshotName), options: .atomic)
            WidgetCenter.shared.reloadAllTimelines()

            return true
        }

        AsyncFunction("clear") { () -> Bool in
            guard let container = Self.containerURL() else {
                return false
            }

            try? FileManager.default.removeItem(at: container.appendingPathComponent(Self.snapshotName))
            WidgetCenter.shared.reloadAllTimelines()

            return true
        }
    }

    private static func containerURL() -> URL? {
        guard
            let group = Bundle.main.object(forInfoDictionaryKey: appGroupInfoKey) as? String,
            !group.isEmpty
        else {
            return nil
        }

        return FileManager.default.containerURL(forSecurityApplicationGroupIdentifier: group)
    }
}
