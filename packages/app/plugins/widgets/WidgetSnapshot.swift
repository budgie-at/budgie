import Foundation
import WidgetKit

struct WidgetThemeColors: Codable {
    let background: String
    let primary: String
    let secondary: String
    let positive: String
    let destructive: String
    let warning: String?
}

struct WidgetPaletteData: Codable {
    let light: WidgetThemeColors
    let dark: WidgetThemeColors
}

struct WidgetStrings: Codable {
    let netWorthTitle: String
    let thisMonth: String
    let budgetTitle: String
    let perDay: String
    let left: String
    let over: String
    let daysLeft: String
    let noBudget: String
    let expense: String
    let income: String
    let transfer: String
    let empty: String

    init(from decoder: Decoder) throws {
        let container = try decoder.container(keyedBy: CodingKeys.self)
        let fallback = SnapshotStore.fallbackStrings

        netWorthTitle = try container.decodeIfPresent(String.self, forKey: .netWorthTitle) ?? fallback.netWorthTitle
        thisMonth = try container.decodeIfPresent(String.self, forKey: .thisMonth) ?? fallback.thisMonth
        budgetTitle = try container.decodeIfPresent(String.self, forKey: .budgetTitle) ?? fallback.budgetTitle
        perDay = try container.decodeIfPresent(String.self, forKey: .perDay) ?? fallback.perDay
        left = try container.decodeIfPresent(String.self, forKey: .left) ?? fallback.left
        over = try container.decodeIfPresent(String.self, forKey: .over) ?? fallback.over
        daysLeft = try container.decodeIfPresent(String.self, forKey: .daysLeft) ?? fallback.daysLeft
        noBudget = try container.decodeIfPresent(String.self, forKey: .noBudget) ?? fallback.noBudget
        expense = try container.decodeIfPresent(String.self, forKey: .expense) ?? fallback.expense
        income = try container.decodeIfPresent(String.self, forKey: .income) ?? fallback.income
        transfer = try container.decodeIfPresent(String.self, forKey: .transfer) ?? fallback.transfer
        empty = try container.decodeIfPresent(String.self, forKey: .empty) ?? fallback.empty
    }

    init(
        netWorthTitle: String,
        thisMonth: String,
        budgetTitle: String,
        perDay: String,
        left: String,
        over: String,
        daysLeft: String,
        noBudget: String,
        expense: String,
        income: String,
        transfer: String,
        empty: String
    ) {
        self.netWorthTitle = netWorthTitle
        self.thisMonth = thisMonth
        self.budgetTitle = budgetTitle
        self.perDay = perDay
        self.left = left
        self.over = over
        self.daysLeft = daysLeft
        self.noBudget = noBudget
        self.expense = expense
        self.income = income
        self.transfer = transfer
        self.empty = empty
    }
}

struct BudgetCategorySnapshot: Codable {
    let title: String
    let progressRatio: Double
    let isOverLimit: Bool
}

struct BudgetSnapshot: Codable {
    let formattedSpent: String
    let formattedLimit: String
    let formattedRemaining: String?
    let progressRatio: Double
    let isOverLimit: Bool
    let daysRemaining: Int
    let formattedSafePerDay: String
    let periodLabel: String
    let categories: [BudgetCategorySnapshot]
}

struct AccountTypeTotal: Codable {
    let label: String
    let formattedTotal: String
}

struct NetWorthSnapshot: Codable {
    let formattedTotal: String
    let formattedDelta: String
    let deltaDirection: String
    let accountTypes: [AccountTypeTotal]?
}

struct RunwaySnapshot: Codable {
    let isPositive: Bool
    let label: String
}

struct WidgetSnapshot: Codable {
    let version: Int
    let generatedAtMs: Double
    let locale: String
    let strings: WidgetStrings
    let palette: WidgetPaletteData
    let netWorth: NetWorthSnapshot?
    let budget: BudgetSnapshot?
    let runway: RunwaySnapshot?
}

enum SnapshotStore {
    private static let appGroupInfoKey = "BudgieAppGroup"
    private static let snapshotName = "snapshot.json"
    private static let supportedVersion = 1

    static let fallbackStrings = WidgetStrings(
        netWorthTitle: "Net worth",
        thisMonth: "This month",
        budgetTitle: "Budget",
        perDay: "per day",
        left: "left",
        over: "over",
        daysLeft: "days left",
        noBudget: "No active budget",
        expense: "Expense",
        income: "Income",
        transfer: "Transfer",
        empty: "No accounts yet"
    )

    static func load() -> WidgetSnapshot? {
        guard
            let container = containerURL(),
            let data = try? Data(contentsOf: container.appendingPathComponent(snapshotName)),
            let snapshot = try? JSONDecoder().decode(WidgetSnapshot.self, from: data),
            snapshot.version == supportedVersion
        else {
            return nil
        }

        return snapshot
    }

    static func containerURL() -> URL? {
        guard
            let group = Bundle.main.object(forInfoDictionaryKey: appGroupInfoKey) as? String,
            !group.isEmpty
        else {
            return nil
        }

        return FileManager.default.containerURL(forSecurityApplicationGroupIdentifier: group)
    }
}

struct WidgetSnapshotEntry: TimelineEntry {
    let date: Date
    let snapshot: WidgetSnapshot?

    var strings: WidgetStrings {
        snapshot?.strings ?? SnapshotStore.fallbackStrings
    }
}

struct SnapshotProvider: TimelineProvider {
    func placeholder(in context: Context) -> WidgetSnapshotEntry {
        WidgetSnapshotEntry(date: Date(), snapshot: nil)
    }

    func getSnapshot(in context: Context, completion: @escaping (WidgetSnapshotEntry) -> Void) {
        completion(WidgetSnapshotEntry(date: Date(), snapshot: SnapshotStore.load()))
    }

    func getTimeline(in context: Context, completion: @escaping (Timeline<WidgetSnapshotEntry>) -> Void) {
        let now = Date()
        let snapshot = SnapshotStore.load()
        let nextMidnight = Calendar.current.nextDate(
            after: now,
            matching: DateComponents(hour: 0, minute: 0),
            matchingPolicy: .nextTime
        ) ?? now.addingTimeInterval(3600)

        completion(
            Timeline(
                entries: [WidgetSnapshotEntry(date: now, snapshot: snapshot), WidgetSnapshotEntry(date: nextMidnight, snapshot: snapshot)],
                policy: .atEnd
            )
        )
    }
}
