import Foundation

public enum AppleWalletCaptureStatus: String, Codable, Sendable {
  case pending = "PENDING"
  case needsReview = "NEEDS_REVIEW"
}

public struct AppleWalletCaptureAccount: Codable, Sendable {
  public let id: Int
  public let title: String
}

public struct AppleWalletCaptureRecord: Codable, Sendable {
  public let captureId: String
  public let accountId: Int
  public let amount: Double
  public let currency: String?
  public let merchant: String
  public let cardName: String?
  public let capturedAt: String
  public let status: AppleWalletCaptureStatus
  public let duplicateTransactionId: Int?
}
