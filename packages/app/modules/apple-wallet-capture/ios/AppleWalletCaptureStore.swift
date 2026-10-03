import Foundation

public actor AppleWalletCaptureStore {
  public static let shared = AppleWalletCaptureStore()

  private static let appGroupIdentifierKey = "BudgieWalletCaptureAppGroupIdentifier"
  private static let accountsFileName = "accounts.json"
  private static let capturesDirectoryName = "captures"
  private static let jsonFileExtension = "json"
  private static let temporaryFileExtension = "tmp"

  private let fileManager: FileManager
  private let jsonDecoder: JSONDecoder
  private let jsonEncoder: JSONEncoder
  private let dateFormatter: ISO8601DateFormatter

  public init(fileManager: FileManager = .default) {
    self.fileManager = fileManager
    self.jsonDecoder = JSONDecoder()
    self.jsonEncoder = JSONEncoder()
    self.jsonEncoder.outputFormatting = [.sortedKeys]
    self.dateFormatter = ISO8601DateFormatter()
    self.dateFormatter.formatOptions = [.withInternetDateTime, .withFractionalSeconds]
  }

  public func replaceAccounts(_ accounts: [AppleWalletCaptureAccount]) async throws {
    let data = try jsonEncoder.encode(accounts)
    let url = try accountsFileURL()

    try ensureStorageDirectories()
    try writeProtectedDataReplacingExisting(data, to: url)
  }

  public func accounts() async throws -> [AppleWalletCaptureAccount] {
    let url = try accountsFileURL()

    guard fileManager.fileExists(atPath: url.path) else {
      return []
    }

    let data = try Data(contentsOf: url)

    return try jsonDecoder.decode([AppleWalletCaptureAccount].self, from: data)
  }

  public func enqueue(accountId: Int, amount: Double, merchant: String, cardName: String?) async throws -> AppleWalletCaptureRecord {
    try ensureStorageDirectories()

    let captureId = UUID().uuidString
    let record = AppleWalletCaptureRecord(
      captureId: captureId,
      accountId: accountId,
      amount: amount,
      merchant: merchant,
      cardName: cardName,
      capturedAt: dateFormatter.string(from: Date()),
      status: .pending,
      duplicateTransactionId: nil
    )
    let data = try jsonEncoder.encode(record)
    let url = try captureFileURL(for: captureId)

    try writeProtectedDataCreatingNew(data, to: url)

    return record
  }

  public func captures() async throws -> [AppleWalletCaptureRecord] {
    let directoryURL = try capturesDirectoryURL()

    guard fileManager.fileExists(atPath: directoryURL.path) else {
      return []
    }

    let fileURLs = try fileManager.contentsOfDirectory(
      at: directoryURL,
      includingPropertiesForKeys: nil,
      options: [.skipsHiddenFiles]
    )
    let records = try fileURLs
      .filter { $0.pathExtension == Self.jsonFileExtension }
      .map { fileURL in
        let data = try Data(contentsOf: fileURL)

        return try jsonDecoder.decode(AppleWalletCaptureRecord.self, from: data)
      }

    return records.sorted { firstRecord, secondRecord in
      if firstRecord.capturedAt == secondRecord.capturedAt {
        return firstRecord.captureId < secondRecord.captureId
      }

      return firstRecord.capturedAt < secondRecord.capturedAt
    }
  }

  public func markNeedsReview(captureId: String, duplicateTransactionId: Int) async throws {
    let url = try captureFileURL(for: captureId)
    let data = try Data(contentsOf: url)
    let record = try jsonDecoder.decode(AppleWalletCaptureRecord.self, from: data)
    let updatedRecord = AppleWalletCaptureRecord(
      captureId: record.captureId,
      accountId: record.accountId,
      amount: record.amount,
      merchant: record.merchant,
      cardName: record.cardName,
      capturedAt: record.capturedAt,
      status: .needsReview,
      duplicateTransactionId: duplicateTransactionId
    )
    let updatedData = try jsonEncoder.encode(updatedRecord)

    try writeProtectedDataReplacingExisting(updatedData, to: url)
  }

  public func acknowledge(captureIds: [String]) async throws {
    let urls = try captureIds.map { try captureFileURL(for: $0) }

    for url in urls {
      if fileManager.fileExists(atPath: url.path) {
        try fileManager.removeItem(at: url)
      }
    }
  }

  private func appGroupContainerURL() throws -> URL {
    guard let appGroupIdentifier = Bundle.main.object(forInfoDictionaryKey: Self.appGroupIdentifierKey) as? String else {
      throw AppleWalletCaptureStoreError.missingAppGroupIdentifier
    }

    guard !appGroupIdentifier.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty else {
      throw AppleWalletCaptureStoreError.missingAppGroupIdentifier
    }

    guard let containerURL = fileManager.containerURL(forSecurityApplicationGroupIdentifier: appGroupIdentifier) else {
      throw AppleWalletCaptureStoreError.unavailableAppGroupContainer(appGroupIdentifier)
    }

    return containerURL
  }

  private func accountsFileURL() throws -> URL {
    return try appGroupContainerURL().appendingPathComponent(Self.accountsFileName, isDirectory: false)
  }

  private func capturesDirectoryURL() throws -> URL {
    return try appGroupContainerURL().appendingPathComponent(Self.capturesDirectoryName, isDirectory: true)
  }

  private func captureFileURL(for captureId: String) throws -> URL {
    let uuid = try canonicalUUID(from: captureId)

    return try capturesDirectoryURL()
      .appendingPathComponent(uuid.uuidString, isDirectory: false)
      .appendingPathExtension(Self.jsonFileExtension)
  }

  private func canonicalUUID(from captureId: String) throws -> UUID {
    guard let uuid = UUID(uuidString: captureId), uuid.uuidString == captureId else {
      throw AppleWalletCaptureStoreError.invalidCaptureId
    }

    return uuid
  }

  private func ensureStorageDirectories() throws {
    let containerURL = try appGroupContainerURL()
    let capturesURL = try capturesDirectoryURL()

    try createProtectedDirectoryIfNeeded(at: containerURL)
    try createProtectedDirectoryIfNeeded(at: capturesURL)
  }

  private func createProtectedDirectoryIfNeeded(at url: URL) throws {
    if fileManager.fileExists(atPath: url.path) {
      try setCompleteUntilFirstUserAuthenticationProtection(at: url)

      return
    }

    try fileManager.createDirectory(
      at: url,
      withIntermediateDirectories: true,
      attributes: [.protectionKey: FileProtectionType.completeUntilFirstUserAuthentication]
    )
    try setCompleteUntilFirstUserAuthenticationProtection(at: url)
  }

  private func writeProtectedDataCreatingNew(_ data: Data, to destinationURL: URL) throws {
    let temporaryURL = destinationURL
      .deletingLastPathComponent()
      .appendingPathComponent("\(destinationURL.deletingPathExtension().lastPathComponent).\(UUID().uuidString)")
      .appendingPathExtension(Self.temporaryFileExtension)

    do {
      try data.write(to: temporaryURL, options: [.withoutOverwriting])
      try setCompleteUntilFirstUserAuthenticationProtection(at: temporaryURL)
      try fileManager.moveItem(at: temporaryURL, to: destinationURL)
      try setCompleteUntilFirstUserAuthenticationProtection(at: destinationURL)
    } catch {
      try removeTemporaryFileIfPresent(at: temporaryURL)

      throw error
    }
  }

  private func writeProtectedDataReplacingExisting(_ data: Data, to destinationURL: URL) throws {
    let temporaryURL = destinationURL
      .deletingLastPathComponent()
      .appendingPathComponent("\(destinationURL.deletingPathExtension().lastPathComponent).\(UUID().uuidString)")
      .appendingPathExtension(Self.temporaryFileExtension)

    do {
      try data.write(to: temporaryURL, options: [.withoutOverwriting])
      try setCompleteUntilFirstUserAuthenticationProtection(at: temporaryURL)

      if fileManager.fileExists(atPath: destinationURL.path) {
        _ = try fileManager.replaceItemAt(destinationURL, withItemAt: temporaryURL)
      } else {
        try fileManager.moveItem(at: temporaryURL, to: destinationURL)
      }

      try setCompleteUntilFirstUserAuthenticationProtection(at: destinationURL)
    } catch {
      try removeTemporaryFileIfPresent(at: temporaryURL)

      throw error
    }
  }

  private func setCompleteUntilFirstUserAuthenticationProtection(at url: URL) throws {
    try fileManager.setAttributes(
      [.protectionKey: FileProtectionType.completeUntilFirstUserAuthentication],
      ofItemAtPath: url.path
    )
  }

  private func removeTemporaryFileIfPresent(at url: URL) throws {
    guard fileManager.fileExists(atPath: url.path) else {
      return
    }

    do {
      try fileManager.removeItem(at: url)
    } catch {
      throw AppleWalletCaptureStoreError.temporaryCleanupFailed(error.localizedDescription)
    }
  }
}

public enum AppleWalletCaptureStoreError: Error, LocalizedError, Sendable {
  case missingAppGroupIdentifier
  case unavailableAppGroupContainer(String)
  case invalidCaptureId
  case temporaryCleanupFailed(String)

  public var errorDescription: String? {
    switch self {
    case .missingAppGroupIdentifier:
      return "Budgie Wallet capture app group identifier is missing."
    case let .unavailableAppGroupContainer(appGroupIdentifier):
      return "Budgie Wallet capture app group container is unavailable for \(appGroupIdentifier)."
    case .invalidCaptureId:
      return "Budgie Wallet capture ID must be a canonical UUID."
    case let .temporaryCleanupFailed(message):
      return "Budgie Wallet capture temporary file cleanup failed: \(message)"
    }
  }
}
