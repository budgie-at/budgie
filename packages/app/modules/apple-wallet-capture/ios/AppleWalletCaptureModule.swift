import ExpoModulesCore

public class AppleWalletCaptureModule: Module {
  public func definition() -> ModuleDefinition {
    Name("AppleWalletCapture")

    AsyncFunction("replaceAccounts") { (accounts: [AppleWalletCaptureAccount]) async throws in
      try await AppleWalletCaptureStore.shared.replaceAccounts(accounts)
    }

    AsyncFunction("getCaptures") { () async throws -> [AppleWalletCaptureRecord] in
      return try await AppleWalletCaptureStore.shared.captures()
    }

    AsyncFunction("markNeedsReview") { (captureId: String, duplicateTransactionId: Int) async throws in
      try await AppleWalletCaptureStore.shared.markNeedsReview(
        captureId: captureId,
        duplicateTransactionId: duplicateTransactionId
      )
    }

    AsyncFunction("acknowledgeCaptures") { (captureIds: [String]) async throws in
      try await AppleWalletCaptureStore.shared.acknowledge(captureIds: captureIds)
    }
  }
}
