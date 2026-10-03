import AppIntents
internal import AppleWalletCapture
import Foundation

@available(iOS 17.0, *)
struct BudgieWalletAccountEntity: AppEntity {
  typealias ID = Int

  static let defaultQuery = BudgieWalletAccountQuery()
  static let typeDisplayRepresentation = TypeDisplayRepresentation(name: "Budgie account")

  let id: Int
  let title: String

  var displayRepresentation: DisplayRepresentation {
    DisplayRepresentation(title: "\(title)")
  }

  init(id: Int, title: String) {
    self.id = id
    self.title = title
  }

  init(account: AppleWalletCaptureAccount) {
    self.id = account.id
    self.title = account.title
  }
}

@available(iOS 17.0, *)
struct BudgieWalletAccountQuery: EntityQuery {
  init() {}

  func entities(for identifiers: [BudgieWalletAccountEntity.ID]) async throws -> [BudgieWalletAccountEntity] {
    let accounts = try await AppleWalletCaptureStore.shared.accounts()
    let requestedIdentifiers = Set(identifiers)

    return accounts
      .filter { requestedIdentifiers.contains($0.id) }
      .map(BudgieWalletAccountEntity.init(account:))
  }

  func suggestedEntities() async throws -> [BudgieWalletAccountEntity] {
    let accounts = try await AppleWalletCaptureStore.shared.accounts()

    return accounts.map(BudgieWalletAccountEntity.init(account:))
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
  static let title: LocalizedStringResource = "Capture Apple Pay transaction"
  static let description = IntentDescription("Save an Apple Pay tap for import into Budgie.")
  static let openAppWhenRun = false

  @Parameter(title: "Amount")
  var amount: Double

  @Parameter(title: "Merchant")
  var merchant: String

  @Parameter(title: "Card")
  var cardName: String?

  @Parameter(title: "Account")
  var account: BudgieWalletAccountEntity

  static var parameterSummary: some ParameterSummary {
    Summary("Capture \(\.$amount) at \(\.$merchant) in \(\.$account)")
  }

  init() {}

  func perform() async throws -> some IntentResult & ProvidesDialog {
    guard amount.isFinite, amount > 0 else {
      throw AppleWalletCaptureIntentError.invalidAmount
    }

    let storedAccounts = try await AppleWalletCaptureStore.shared.accounts()
    let accountIsAvailable = storedAccounts.contains { storedAccount in
      storedAccount.id == account.id
    }

    guard accountIsAvailable else {
      throw AppleWalletCaptureIntentError.accountUnavailable
    }

    let trimmedMerchant = merchant.trimmingCharacters(in: .whitespacesAndNewlines)
    let trimmedCardName = cardName?.trimmingCharacters(in: .whitespacesAndNewlines)

    _ = try await AppleWalletCaptureStore.shared.enqueue(
      accountId: account.id,
      amount: amount,
      merchant: trimmedMerchant,
      cardName: trimmedCardName
    )

    return .result(dialog: "Saved to Budgie")
  }
}
