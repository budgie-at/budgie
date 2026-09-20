import SwiftUI

struct WidgetEmptyState: View {
    let message: String
    let palette: WidgetPalette

    var body: some View {
        Text(message)
            .font(.footnote)
            .foregroundColor(palette.secondary)
            .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .leading)
    }
}
