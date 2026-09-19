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

    static var createExpense: URL? {
        route("create-transaction/expense")
    }

    static var createIncome: URL? {
        route("create-transaction/income")
    }

    static var createTransfer: URL? {
        route("create-transaction/transfer")
    }

    static func createExpense(categoryId: Int) -> URL? {
        route("create-transaction/expense?categoryId=\(categoryId)")
    }
}
