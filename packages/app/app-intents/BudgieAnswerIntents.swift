import AppIntents
@preconcurrency import CoreSpotlight
internal import ExpoAppIntents
import Foundation
import UniformTypeIdentifiers

@available(iOS 17.0, *)
enum BudgieAnswerKey: String {
  case monthKey = "MONTH_KEY"
  case asOf = "AS_OF"
  case isLocked = "IS_LOCKED"
  case thisMonth = "THIS_MONTH"
  case lastMonth = "LAST_MONTH"
  case budget = "BUDGET"
  case balance = "BALANCE"
  case netWorth = "NET_WORTH"
  case upcoming = "UPCOMING"
  case refresh = "REFRESH"
  case locked = "LOCKED"
  case unavailable = "UNAVAILABLE"
}

@available(iOS 17.0, *)
enum BudgieCatalog {
  static let summaryKind = "SUMMARY"
  static let categoryAnswerKind = "CATEGORY_ANSWER"
  static let accountAnswerKind = "ACCOUNT_ANSWER"
  static let summaryId = "summary"

  static func records(ofKind kind: String, matching string: String) async throws -> [AppIntentEntityRecord] {
    let search = string.trimmingCharacters(in: .whitespacesAndNewlines)
    guard !search.isEmpty else {
      return []
    }

    return try await AppIntentEntityStore.shared.entities(ofKind: kind).filter { record in
      record.title.range(of: search, options: [.caseInsensitive, .diacriticInsensitive]) != nil
    }
  }

  static func answer(kind: String, id: String, key: BudgieAnswerKey) async -> IntentDialog {
    let store = AppIntentEntityStore.shared
    let summary = try? await store.entities(ofKind: summaryKind, matching: [summaryId]).first
    let record = try? await store.entities(ofKind: kind, matching: [id]).first
    let fallback = { (fallbackKey: BudgieAnswerKey, english: String) in
      IntentDialog(stringLiteral: summary?.metadata[fallbackKey.rawValue] ?? english)
    }

    guard let record,
      record.metadata[BudgieAnswerKey.monthKey.rawValue] == today(format: "yyyy-MM"),
      key != .upcoming || record.metadata[BudgieAnswerKey.asOf.rawValue] == today(format: "yyyy-MM-dd")
    else {
      return fallback(.refresh, "Open Budgie to refresh.")
    }

    if record.metadata[BudgieAnswerKey.isLocked.rawValue] == "true" {
      return fallback(.locked, "Unlock Budgie to see this.")
    }

    guard let answer = record.metadata[key.rawValue] else {
      return fallback(.unavailable, "This isn’t available in Budgie yet.")
    }

    return IntentDialog(stringLiteral: answer)
  }

  private static func today(format: String) -> String {
    let formatter = DateFormatter()
    formatter.calendar = Calendar(identifier: .gregorian)
    formatter.locale = Locale(identifier: "en_US_POSIX")
    formatter.dateFormat = format
    return formatter.string(from: Date())
  }
}

@available(iOS 17.0, *)
struct BudgieCategoryEntity: AppEntity, AppIntentEntityRecordConvertible {
  static let catalogKind = "CATEGORY"
  static let defaultQuery = BudgieCategoryQuery()
  static let typeDisplayRepresentation = TypeDisplayRepresentation(name: "Budgie category")

  let id: String
  let title: String

  var displayRepresentation: DisplayRepresentation {
    DisplayRepresentation(title: "\(title)")
  }

  init(record: AppIntentEntityRecord) {
    self.id = record.id
    self.title = record.title
  }
}

@available(iOS 18.0, *)
extension BudgieCategoryEntity: IndexedEntity {
  var attributeSet: CSSearchableItemAttributeSet {
    let attributes = CSSearchableItemAttributeSet(contentType: .text)
    attributes.title = title
    attributes.displayName = title
    return attributes
  }
}

@available(iOS 17.0, *)
struct BudgieCategoryQuery: EntityStringQuery {
  init() {}

  func entities(for identifiers: [BudgieCategoryEntity.ID]) async throws -> [BudgieCategoryEntity] {
    return try await AppIntentEntityStore.shared
      .entities(ofKind: BudgieCategoryEntity.catalogKind, matching: identifiers)
      .map(BudgieCategoryEntity.init(record:))
  }

  func suggestedEntities() async throws -> [BudgieCategoryEntity] {
    return try await AppIntentEntityStore.shared
      .entities(ofKind: BudgieCategoryEntity.catalogKind)
      .map(BudgieCategoryEntity.init(record:))
  }

  func entities(matching string: String) async throws -> [BudgieCategoryEntity] {
    return try await BudgieCatalog.records(ofKind: BudgieCategoryEntity.catalogKind, matching: string)
      .map(BudgieCategoryEntity.init(record:))
  }
}

@available(iOS 18.0, *)
extension BudgieCategoryQuery: EnumerableEntityQuery {
  func allEntities() async throws -> [BudgieCategoryEntity] {
    return try await suggestedEntities()
  }
}

@available(iOS 17.0, *)
enum BudgieSpendingPeriod: String, AppEnum {
  case thisMonth
  case lastMonth

  static let typeDisplayRepresentation = TypeDisplayRepresentation(name: "Period")
  static let caseDisplayRepresentations: [BudgieSpendingPeriod: DisplayRepresentation] = [
    .thisMonth: "This month",
    .lastMonth: "Last month"
  ]

  var answerKey: BudgieAnswerKey {
    return self == .thisMonth ? .thisMonth : .lastMonth
  }
}

@available(iOS 17.0, *)
struct SpendingIntent: AppIntent {
  static let title: LocalizedStringResource = "Category spending"
  static let description = IntentDescription("Hear how much you spent in a Budgie category.")
  static let openAppWhenRun = false
  static let authenticationPolicy = IntentAuthenticationPolicy.requiresAuthentication

  @Parameter(title: "Category")
  var category: BudgieCategoryEntity

  @Parameter(title: "Period", default: .thisMonth)
  var period: BudgieSpendingPeriod

  static var parameterSummary: some ParameterSummary {
    Summary("Spending on \(\.$category) \(\.$period)")
  }

  init() {}

  func perform() async throws -> some IntentResult & ProvidesDialog {
    return .result(dialog: await BudgieCatalog.answer(kind: BudgieCatalog.categoryAnswerKind, id: category.id, key: period.answerKey))
  }
}

@available(iOS 17.0, *)
struct BudgetStatusIntent: AppIntent {
  static let title: LocalizedStringResource = "Budget status"
  static let description = IntentDescription("Hear how your Budgie budget is going.")
  static let openAppWhenRun = false
  static let authenticationPolicy = IntentAuthenticationPolicy.requiresAuthentication

  init() {}

  func perform() async throws -> some IntentResult & ProvidesDialog {
    return .result(dialog: await BudgieCatalog.answer(kind: BudgieCatalog.summaryKind, id: BudgieCatalog.summaryId, key: .budget))
  }
}

@available(iOS 17.0, *)
struct BalanceIntent: AppIntent {
  static let title: LocalizedStringResource = "Balance"
  static let description = IntentDescription("Hear an account balance or your net worth from Budgie.")
  static let openAppWhenRun = false
  static let authenticationPolicy = IntentAuthenticationPolicy.requiresAuthentication

  @Parameter(title: "Account")
  var account: BudgieWalletAccountEntity?

  static var parameterSummary: some ParameterSummary {
    Summary("Balance of \(\.$account)")
  }

  init() {}

  func perform() async throws -> some IntentResult & ProvidesDialog {
    guard let account else {
      return .result(dialog: await BudgieCatalog.answer(kind: BudgieCatalog.summaryKind, id: BudgieCatalog.summaryId, key: .netWorth))
    }

    return .result(dialog: await BudgieCatalog.answer(kind: BudgieCatalog.accountAnswerKind, id: String(account.id), key: .balance))
  }
}

@available(iOS 17.0, *)
struct UpcomingChargesIntent: AppIntent {
  static let title: LocalizedStringResource = "Upcoming charges"
  static let description = IntentDescription("Hear which recurring charges Budgie expects in the next 7 days.")
  static let openAppWhenRun = false
  static let authenticationPolicy = IntentAuthenticationPolicy.requiresAuthentication

  init() {}

  func perform() async throws -> some IntentResult & ProvidesDialog {
    return .result(dialog: await BudgieCatalog.answer(kind: BudgieCatalog.summaryKind, id: BudgieCatalog.summaryId, key: .upcoming))
  }
}

@available(iOS 17.0, *)
struct BudgieShortcuts: AppShortcutsProvider {
  static var appShortcuts: [AppShortcut] {
    AppShortcut(
      intent: SpendingIntent(),
      phrases: [
        "How much did I spend on \(\.$category) in \(.applicationName)",
        "\(.applicationName) spending on \(\.$category)",
        "How much did I spend in \(.applicationName)"
      ],
      shortTitle: "Spending",
      systemImageName: "chart.pie"
    )
    AppShortcut(
      intent: BudgetStatusIntent(),
      phrases: ["How is my \(.applicationName) budget", "\(.applicationName) budget status"],
      shortTitle: "Budget status",
      systemImageName: "gauge.with.needle"
    )
    AppShortcut(
      intent: BalanceIntent(),
      phrases: [
        "What's my \(\.$account) balance in \(.applicationName)",
        "What's my balance in \(.applicationName)",
        "What's my net worth in \(.applicationName)"
      ],
      shortTitle: "Balance",
      systemImageName: "banknote"
    )
    AppShortcut(
      intent: UpcomingChargesIntent(),
      phrases: ["What bills are due in \(.applicationName)", "Upcoming charges in \(.applicationName)"],
      shortTitle: "Upcoming charges",
      systemImageName: "calendar"
    )
  }
}
