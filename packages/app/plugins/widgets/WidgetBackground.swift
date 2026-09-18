import SwiftUI
import WidgetKit

extension View {
    func widgetBackground<Background: View>(_ background: Background) -> some View {
        if #available(iOS 17.0, *) {
            return containerBackground(for: .widget) { background }
        }

        return self.background(background)
    }
}
