import Foundation

public enum AppleWalletCaptureStatus: String, Codable, Sendable {
  case pending = "PENDING"
  case needsReview = "NEEDS_REVIEW"
}

public struct AppleWalletCaptureAccount: Codable, Sendable {
  public let id: Int
  public let title: String

  public init(id: Int, title: String) {
    self.id = id
    self.title = title
  }
}

public struct AppleWalletCaptureRecord: Codable, Sendable {
  public let captureId: String
  public let accountId: Int
  public let amount: Double
  public let merchant: String
  public let cardName: String?
  public let capturedAt: String
  public let status: AppleWalletCaptureStatus
  public let duplicateTransactionId: Int?

  public init(
    captureId: String,
    accountId: Int,
    amount: Double,
    merchant: String,
    cardName: String?,
    capturedAt: String,
    status: AppleWalletCaptureStatus,
    duplicateTransactionId: Int?
  ) {
    self.captureId = captureId
    self.accountId = accountId
    self.amount = amount
    self.merchant = merchant
    self.cardName = cardName
    self.capturedAt = capturedAt
    self.status = status
    self.duplicateTransactionId = duplicateTransactionId
  }
}
