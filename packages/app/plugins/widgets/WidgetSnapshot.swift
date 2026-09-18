import Foundation

struct WidgetThemeColors: Codable {
    let background: String
    let primary: String
    let secondary: String
    let positive: String
    let destructive: String
}

struct WidgetPaletteData: Codable {
    let light: WidgetThemeColors
    let dark: WidgetThemeColors
}

struct WidgetStrings: Codable {
    let netWorthTitle: String
    let thisMonth: String
    let fiat: String
    let crypto: String
    let empty: String
}

struct NetWorthSnapshot: Codable {
    let formattedTotal: String
    let formattedDelta: String
    let deltaDirection: String
    let formattedFiat: String
    let formattedCrypto: String
    let hasCrypto: Bool
    let history: [Double]
}

struct WidgetSnapshot: Codable {
    let version: Int
    let generatedAtMs: Double
    let locale: String
    let strings: WidgetStrings
    let palette: WidgetPaletteData
    let netWorth: NetWorthSnapshot?
}

enum SnapshotStore {
    private static let appGroupInfoKey = "BudgieAppGroup"
    private static let snapshotName = "snapshot.json"
    private static let supportedVersion = 1

    static let fallbackStrings = WidgetStrings(
        netWorthTitle: "Net worth",
        thisMonth: "This month",
        fiat: "Cash",
        crypto: "Crypto",
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
