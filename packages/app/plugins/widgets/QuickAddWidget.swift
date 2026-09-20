import SwiftUI
import UIKit
import WidgetKit

struct QuickAddActionTile: View {
    let title: String
    let symbolName: String
    let destination: URL?
    let palette: WidgetPalette

    var body: some View {
        if let destination {
            Link(destination: destination) { tile }
        } else {
            tile
        }
    }

    private var tile: some View {
        VStack(spacing: 5) {
            Image(systemName: symbolName)
                .font(.system(size: 19, weight: .medium))
                .foregroundColor(palette.primary)
                .frame(height: 21)
            Text(title)
                .font(.caption2)
                .foregroundColor(palette.secondary)
                .lineLimit(1)
                .minimumScaleFactor(0.7)
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity)
        .background(palette.secondary.opacity(0.12))
        .cornerRadius(12)
    }
}

struct QuickAddLogoTile: View {
    let palette: WidgetPalette

    var body: some View {
        if let destination = WidgetLinks.home {
            Link(destination: destination) { tile }
        } else {
            tile
        }
    }

    private var tile: some View {
        glyph
            .frame(maxWidth: .infinity, maxHeight: .infinity)
            .contentShape(Rectangle())
    }

    @ViewBuilder
    private var glyph: some View {
        if let logo = UIImage(named: "budgie-glyph") {
            Image(uiImage: logo)
                .renderingMode(.template)
                .resizable()
                .scaledToFit()
                .foregroundColor(palette.primary)
                .padding(10)
        } else {
            Image(systemName: "app.fill")
                .font(.title2)
                .foregroundColor(palette.primary)
        }
    }
}

struct QuickAddWidgetView: View {
    let entry: WidgetSnapshotEntry

    @Environment(\.colorScheme) private var colorScheme

    private var palette: WidgetPalette {
        WidgetPalette(snapshot: entry.snapshot, colorScheme: colorScheme)
    }

    var body: some View {
        VStack(spacing: 6) {
            HStack(spacing: 6) {
                QuickAddActionTile(
                    title: entry.strings.expense,
                    symbolName: "minus.circle",
                    destination: WidgetLinks.createExpense,
                    palette: palette
                )
                QuickAddActionTile(
                    title: entry.strings.income,
                    symbolName: "plus.circle",
                    destination: WidgetLinks.createIncome,
                    palette: palette
                )
            }
            HStack(spacing: 6) {
                QuickAddActionTile(
                    title: entry.strings.transfer,
                    symbolName: "arrow.left.arrow.right",
                    destination: WidgetLinks.createTransfer,
                    palette: palette
                )
                QuickAddLogoTile(palette: palette)
            }
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .leading)
        .widgetBackground(palette.background)
        .widgetURL(WidgetLinks.createExpense)
        .environment(\.locale, Locale(identifier: entry.snapshot?.locale ?? "en-US"))
    }
}

struct QuickAddWidget: Widget {
    var body: some WidgetConfiguration {
        StaticConfiguration(kind: "BudgieQuickAdd", provider: SnapshotProvider()) { entry in
            QuickAddWidgetView(entry: entry)
        }
        .configurationDisplayName("Quick add")
        .description("Expense, income and transfer in one tap.")
        .supportedFamilies([.systemSmall])
    }
}
