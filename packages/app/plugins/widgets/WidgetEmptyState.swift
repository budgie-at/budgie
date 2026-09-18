import SwiftUI

struct WidgetEmptyState: View {
    let message: String
    let palette: WidgetPalette

    var body: some View {
        VStack(alignment: .leading, spacing: 4) {
            Text(message)
                .font(.footnote)
                .foregroundColor(palette.secondary)
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .leading)
    }
}
