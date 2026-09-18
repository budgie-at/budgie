import SwiftUI
import WidgetKit

@main
struct BudgieWidgets: WidgetBundle {
    var body: some Widget {
        NetWorthWidget()
        NetWorthMediumWidget()
        SpendingWidget()
        SpendingMediumWidget()
    }
}
