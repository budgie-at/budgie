import Foundation

enum WidgetLinks {
    private static let schemeInfoKey = "BudgieScheme"

    static func route(_ path: String) -> URL? {
        guard
            let scheme = Bundle.main.object(forInfoDictionaryKey: schemeInfoKey) as? String,
            !scheme.isEmpty
        else {
            return nil
        }

        return URL(string: "\(scheme)://\(path)")
    }

    static var home: URL? {
        route("")
    }
}
