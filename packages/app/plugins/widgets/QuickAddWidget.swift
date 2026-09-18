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
        Link(destination: destination ?? URL(string: "budgie://")!) {
            VStack(spacing: 4) {
                Image(systemName: symbolName)
                    .font(.title3)
                    .foregroundColor(palette.primary)
                Text(title)
                    .font(.caption2)
                    .foregroundColor(palette.secondary)
                    .lineLimit(1)
                    .minimumScaleFactor(0.7)
            }
            .frame(maxWidth: .infinity)
            .padding(.vertical, 8)
            .background(palette.secondary.opacity(0.12))
            .cornerRadius(10)
        }
    }
}

struct QuickAddCategoryChip: View {
    let category: QuickAddCategory
    let palette: WidgetPalette

    var body: some View {
        Link(destination: WidgetLinks.createExpense(categoryId: category.id) ?? URL(string: "budgie://")!) {
            Text(category.title)
                .font(.caption2)
                .foregroundColor(palette.primary)
                .lineLimit(1)
                .minimumScaleFactor(0.7)
                .padding(.horizontal, 8)
                .padding(.vertical, 5)
                .background(palette.secondary.opacity(0.12))
                .cornerRadius(8)
        }
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
            .environment(\.locale, Locale(identifier: entry.snapshot?.locale ?? "en-US"))
    }

    @ViewBuilder
    private var content: some View {
        if isMedium {
            VStack(alignment: .leading, spacing: 8) {
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
                    HStack(spacing: 6) {
                        ForEach(categories, id: \.id) { category in
                            QuickAddCategoryChip(category: category, palette: palette)
                        }
                        Spacer(minLength: 0)
                    }
                }
            }
        } else {
            VStack(alignment: .leading, spacing: 6) {
                Image(systemName: "plus.circle.fill")
                    .font(.largeTitle)
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
                .widgetURL(WidgetLinks.createExpense)
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
