internal import ExpoAppIntents
internal import ExpoModulesCore

final class AppIntentsSetup: Module {
  public func definition() -> ExpoModulesCore.ModuleDefinition {
    Name("AppIntentsSetup")

    OnCreate {
      if #available(iOS 18.0, *) {
        AppEntityIdentifierRegistry.shared.registerIndexed(BudgieCategoryEntity.catalogKind, as: BudgieCategoryEntity.self)
      }

      if #available(iOS 17.0, *) {
        Task {
          await AppIntentDispatcher.shared.setShortcutsRefreshHandler {
            BudgieShortcuts.updateAppShortcutParameters()
          }
          BudgieShortcuts.updateAppShortcutParameters()
        }
      }
    }
  }
}
