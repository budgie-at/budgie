import AppIntents
internal import ExpoAppIntents
import Foundation

@available(iOS 17.0, *)
struct BudgieWalletAccountEntity: AppEntity {
  typealias ID = Int

  static let catalogKind = "walletAccount"
  static let defaultQuery = BudgieWalletAccountQuery()
  static let typeDisplayRepresentation = TypeDisplayRepresentation(name: "Budgie account")

  let id: Int
  let title: String

  var displayRepresentation: DisplayRepresentation {
    DisplayRepresentation(title: "\(title)")
  }

  init?(record: AppIntentEntityRecord) {
    guard let id = Int(record.id) else {
      return nil
    }

    self.id = id
    self.title = record.title
  }
}

@available(iOS 17.0, *)
struct BudgieWalletAccountQuery: EntityQuery {
  init() {}

  func entities(for identifiers: [BudgieWalletAccountEntity.ID]) async throws -> [BudgieWalletAccountEntity] {
    return try await AppIntentEntityStore.shared
      .entities(ofKind: BudgieWalletAccountEntity.catalogKind, matching: identifiers.map(String.init))
      .compactMap(BudgieWalletAccountEntity.init(record:))
  }

  func suggestedEntities() async throws -> [BudgieWalletAccountEntity] {
    return try await AppIntentEntityStore.shared
      .entities(ofKind: BudgieWalletAccountEntity.catalogKind)
      .compactMap(BudgieWalletAccountEntity.init(record:))
  }
}

@available(iOS 17.0, *)
enum AppleWalletCaptureIntentError: Error, CustomLocalizedStringResourceConvertible {
  case invalidAmount
  case accountUnavailable

  var localizedStringResource: LocalizedStringResource {
    switch self {
    case .invalidAmount:
      return "The Wallet amount is missing or invalid."
    case .accountUnavailable:
      return "Open Budgie and refresh the available accounts."
    }
  }
}

@available(iOS 17.0, *)
struct CaptureApplePayTransactionIntent: AppIntent {
  static let title: LocalizedStringResource = "Capture contactless payment"
  static let description = IntentDescription("Save a contactless payment tap for import into Budgie.")
  static let openAppWhenRun = false

  @Parameter(title: "Amount")
  var amount: Double

  @Parameter(title: "Currency")
  var currency: String?

  @Parameter(title: "Merchant")
  var merchant: String

  @Parameter(title: "Card")
  var cardName: String?

  @Parameter(title: "Account")
  var account: BudgieWalletAccountEntity?

  static var parameterSummary: some ParameterSummary {
    Summary("Capture \(\.$amount) at \(\.$merchant)") {
      \.$cardName
      \.$currency
      \.$account
    }
  }

  init() {}

  func perform() async throws -> some IntentResult & ProvidesDialog {
    guard amount.isFinite, amount > 0 else {
      throw AppleWalletCaptureIntentError.invalidAmount
    }

    if let account {
      guard try await !BudgieWalletAccountQuery().entities(for: [account.id]).isEmpty else {
        throw AppleWalletCaptureIntentError.accountUnavailable
      }
    }

    let normalizedCurrency = currency?.trimmingCharacters(in: .whitespacesAndNewlines).uppercased() ?? ""
    let trimmedCardName = cardName?.trimmingCharacters(in: .whitespacesAndNewlines)

    await AppIntentDispatcher.shared.dispatch(
      name: "captureApplePayTransaction",
      params: [
        "accountId": account.map { AppIntentValue.int($0.id) } ?? .null,
        "amount": .double(amount),
        "currency": normalizedCurrency.isEmpty ? .null : .string(normalizedCurrency),
        "merchant": .string(merchant.trimmingCharacters(in: .whitespacesAndNewlines)),
        "cardName": trimmedCardName.map(AppIntentValue.string) ?? .null
      ]
    )

    return .result(dialog: "Saved to Budgie")
  }
}
