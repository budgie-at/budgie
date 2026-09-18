import SwiftUI
import WidgetKit

struct SpendingEntry: TimelineEntry {
    let date: Date
    let snapshot: WidgetSnapshot?

    var strings: WidgetStrings {
        snapshot?.strings ?? SnapshotStore.fallbackStrings
    }
}

struct SpendingProvider: TimelineProvider {
    func placeholder(in context: Context) -> SpendingEntry {
        SpendingEntry(date: Date(), snapshot: nil)
    }

    func getSnapshot(in context: Context, completion: @escaping (SpendingEntry) -> Void) {
        completion(SpendingEntry(date: Date(), snapshot: SnapshotStore.load()))
    }

    func getTimeline(in context: Context, completion: @escaping (Timeline<SpendingEntry>) -> Void) {
        let now = Date()
        let snapshot = SnapshotStore.load()
        let nextMidnight = Calendar.current.nextDate(
            after: now,
            matching: DateComponents(hour: 0, minute: 0),
            matchingPolicy: .nextTime
        ) ?? now.addingTimeInterval(3600)

        completion(
            Timeline(
                entries: [SpendingEntry(date: now, snapshot: snapshot), SpendingEntry(date: nextMidnight, snapshot: snapshot)],
                policy: .atEnd
            )
        )
    }
}

struct SpendingProgressRing: View {
    let budget: BudgetSnapshot
    let palette: WidgetPalette

    private var accent: Color {
        budget.isOverLimit ? palette.destructive : palette.primary
    }

    var body: some View {
        ZStack {
            Circle()
                .stroke(palette.secondary.opacity(0.25), lineWidth: 8)
            Circle()
                .trim(from: 0, to: min(max(budget.progressRatio, 0), 1))
                .stroke(accent, style: StrokeStyle(lineWidth: 8, lineCap: .round))
                .rotationEffect(.degrees(-90))
            Text("\(Int((budget.progressRatio * 100).rounded()))%")
                .font(.caption.weight(.semibold))
                .foregroundColor(accent)
        }
    }
}

struct SpendingCategoryRow: View {
    let category: BudgetCategorySnapshot
    let palette: WidgetPalette

    private var valueColor: Color {
        category.isOverLimit ? palette.destructive : palette.primary
    }

    var body: some View {
        HStack {
            Text(category.title)
                .font(.caption)
                .foregroundColor(palette.secondary)
                .lineLimit(1)
            Spacer()
            Text("\(Int((category.progressRatio * 100).rounded()))%")
                .font(.caption.weight(.medium))
                .foregroundColor(valueColor)
        }
    }
}

struct SpendingWidgetView: View {
    let entry: SpendingEntry
    let isMedium: Bool

    @Environment(\.colorScheme) private var colorScheme

    private var palette: WidgetPalette {
        WidgetPalette(snapshot: entry.snapshot, colorScheme: colorScheme)
    }

    var body: some View {
        content
            .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .leading)
            .widgetBackground(palette.background)
            .widgetURL(WidgetLinks.route("budget"))
            .environment(\.locale, Locale(identifier: entry.snapshot?.locale ?? "en-US"))
    }

    private func primaryAmountText(_ budget: BudgetSnapshot) -> String {
        isMedium ? "\(budget.formattedSpent) / \(budget.formattedLimit)" : "\(budget.formattedRemaining ?? budget.formattedSpent) \(entry.strings.left)"
    }

    @ViewBuilder
    private var content: some View {
        if let budget = entry.snapshot?.budget {
            HStack(alignment: .top, spacing: 12) {
                VStack(alignment: .leading, spacing: 6) {
                    Text(entry.strings.budgetTitle)
                        .font(.caption)
                        .foregroundColor(palette.secondary)
                    Text(primaryAmountText(budget))
                        .font(.footnote.weight(.semibold))
                        .foregroundColor(palette.primary)
                        .minimumScaleFactor(0.5)
                        .lineLimit(1)
                        .privacySensitive()
                    Text("\(budget.formattedSafePerDay) \(entry.strings.perDay)")
                        .font(.caption2)
                        .foregroundColor(palette.secondary)
                        .privacySensitive()
                    Text("\(budget.daysRemaining) \(entry.strings.daysLeft)")
                        .font(.caption2)
                        .foregroundColor(palette.secondary)

                    if isMedium {
                        Spacer(minLength: 2)
                        ForEach(budget.categories, id: \.title) { category in
                            SpendingCategoryRow(category: category, palette: palette)
                        }
                    }
                }

                SpendingProgressRing(budget: budget, palette: palette)
                    .frame(width: 52, height: 52)
            }
        } else {
            WidgetEmptyState(message: entry.strings.noBudget, palette: palette)
        }
    }
}

struct SpendingWidget: Widget {
    var body: some WidgetConfiguration {
        StaticConfiguration(kind: "BudgieSpending", provider: SpendingProvider()) { entry in
            SpendingWidgetView(entry: entry, isMedium: false)
        }
        .configurationDisplayName("Budget")
        .description("How much of this period's budget is left.")
        .supportedFamilies([.systemSmall])
    }
}

struct SpendingMediumWidget: Widget {
    var body: some WidgetConfiguration {
        StaticConfiguration(kind: "BudgieSpendingMedium", provider: SpendingProvider()) { entry in
            SpendingWidgetView(entry: entry, isMedium: true)
        }
        .configurationDisplayName("Budget by category")
        .description("Budget progress with the categories closest to their limit.")
        .supportedFamilies([.systemMedium])
    }
}
