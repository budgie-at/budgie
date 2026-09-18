import SwiftUI

extension Color {
    init?(budgieHex hex: String) {
        var value = hex
        if value.hasPrefix("#") {
            value.removeFirst()
        }

        guard value.count == 6, let rgb = UInt32(value, radix: 16) else {
            return nil
        }

        self.init(
            .sRGB,
            red: Double((rgb >> 16) & 0xFF) / 255,
            green: Double((rgb >> 8) & 0xFF) / 255,
            blue: Double(rgb & 0xFF) / 255,
            opacity: 1
        )
    }
}

struct WidgetPalette {
    let colors: WidgetThemeColors?

    init(snapshot: WidgetSnapshot?, colorScheme: ColorScheme) {
        colors = colorScheme == .dark ? snapshot?.palette.dark : snapshot?.palette.light
    }

    var background: Color {
        resolve(colors?.background) ?? Color(.systemBackground)
    }

    var primary: Color {
        resolve(colors?.primary) ?? Color(.label)
    }

    var secondary: Color {
        resolve(colors?.secondary) ?? Color(.secondaryLabel)
    }

    var positive: Color {
        resolve(colors?.positive) ?? .green
    }

    var destructive: Color {
        resolve(colors?.destructive) ?? .red
    }

    var warning: Color {
        resolve(colors?.warning) ?? .orange
    }

    private func resolve(_ hex: String?) -> Color? {
        guard let hex else {
            return nil
        }

        return Color(budgieHex: hex)
    }
}
