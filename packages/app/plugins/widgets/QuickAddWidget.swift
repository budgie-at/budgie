import SwiftUI
import WidgetKit

struct QuickAddEntry: TimelineEntry {
    let date: Date
    let snapshot: WidgetSnapshot?

    var strings: WidgetStrings {
        snapshot?.strings ?? SnapshotStore.fallbackStrings
    }
}

struct QuickAddProvider: TimelineProvider {
    func placeholder(in context: Context) -> QuickAddEntry {
        QuickAddEntry(date: Date(), snapshot: nil)
    }

    func getSnapshot(in context: Context, completion: @escaping (QuickAddEntry) -> Void) {
        completion(QuickAddEntry(date: Date(), snapshot: SnapshotStore.load()))
    }

    func getTimeline(in context: Context, completion: @escaping (Timeline<QuickAddEntry>) -> Void) {
        completion(Timeline(entries: [QuickAddEntry(date: Date(), snapshot: SnapshotStore.load())], policy: .never))
    }
}

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

struct QuickAddCategoryChip: View {
    let category: QuickAddCategory
    let palette: WidgetPalette

    var body: some View {
        if let destination = WidgetLinks.createExpense(categoryId: category.id) {
            Link(destination: destination) { chip }
        } else {
            chip
        }
    }

    private var chip: some View {
        Text(category.title)
            .font(.caption2)
            .foregroundColor(palette.primary)
            .lineLimit(1)
            .minimumScaleFactor(0.6)
            .padding(.horizontal, 6)
            .frame(maxWidth: .infinity, minHeight: 30)
            .background(palette.secondary.opacity(0.12))
            .cornerRadius(9)
    }
}

struct QuickAddWidgetView: View {
    let entry: QuickAddEntry
    let isMedium: Bool

    @Environment(\.colorScheme) private var colorScheme

    private var palette: WidgetPalette {
        WidgetPalette(snapshot: entry.snapshot, colorScheme: colorScheme)
    }

    var body: some View {
        content
            .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .leading)
            .widgetBackground(palette.background)
            .widgetURL(WidgetLinks.createExpense)
            .environment(\.locale, Locale(identifier: entry.snapshot?.locale ?? "en-US"))
    }

    @ViewBuilder
    private var content: some View {
        if isMedium {
            VStack(spacing: 8) {
                HStack(spacing: 8) {
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
                    QuickAddActionTile(
                        title: entry.strings.transfer,
                        symbolName: "arrow.left.arrow.right",
                        destination: WidgetLinks.createTransfer,
                        palette: palette
                    )
                }

                if let categories = entry.snapshot?.quickAddCategories, !categories.isEmpty {
                    HStack(spacing: 8) {
                        ForEach(categories, id: \.id) { category in
                            QuickAddCategoryChip(category: category, palette: palette)
                        }
                    }
                    .fixedSize(horizontal: false, vertical: true)
                }
            }
        } else {
            VStack(alignment: .leading, spacing: 8) {
                Image(systemName: "plus.circle.fill")
                    .font(.system(size: 34, weight: .medium))
                    .foregroundColor(palette.primary)
                Text(entry.strings.addExpense)
                    .font(.caption)
                    .foregroundColor(palette.secondary)
                    .lineLimit(2)
            }
            .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .leading)
        }
    }
}

struct QuickAddWidget: Widget {
    var body: some WidgetConfiguration {
        StaticConfiguration(kind: "BudgieQuickAdd", provider: QuickAddProvider()) { entry in
            QuickAddWidgetView(entry: entry, isMedium: false)
        }
        .configurationDisplayName("Quick add")
        .description("Log an expense without hunting for the app.")
        .supportedFamilies([.systemSmall])
    }
}

struct QuickAddMediumWidget: Widget {
    var body: some WidgetConfiguration {
        StaticConfiguration(kind: "BudgieQuickAddMedium", provider: QuickAddProvider()) { entry in
            QuickAddWidgetView(entry: entry, isMedium: true)
        }
        .configurationDisplayName("Quick add actions")
        .description("Expense, income and transfer, plus your most used categories.")
        .supportedFamilies([.systemMedium])
    }
}
