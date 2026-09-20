import SwiftUI
import WidgetKit

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
    let entry: WidgetSnapshotEntry
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

    @ViewBuilder
    private var content: some View {
        if let budget = entry.snapshot?.budget {
            if isMedium {
                mediumContent(budget)
            } else {
                smallContent(budget)
            }
        } else {
            WidgetEmptyState(message: entry.strings.noBudget, palette: palette)
        }
    }

    private func mediumContent(_ budget: BudgetSnapshot) -> some View {
        VStack(alignment: .leading, spacing: 10) {
            HStack(alignment: .center, spacing: 12) {
                VStack(alignment: .leading, spacing: 3) {
                    Text(entry.strings.budgetTitle)
                        .font(.caption)
                        .foregroundColor(palette.secondary)
                    Text("\(budget.formattedSpent) / \(budget.formattedLimit)")
                        .font(.title3.weight(.semibold))
                        .foregroundColor(palette.primary)
                        .minimumScaleFactor(0.5)
                        .lineLimit(1)
                        .privacySensitive()
                    Text(paceText(budget))
                        .font(.caption2)
                        .foregroundColor(palette.secondary)
                        .lineLimit(1)
                        .minimumScaleFactor(0.7)
                        .privacySensitive()
                }

                Spacer(minLength: 8)

                SpendingProgressRing(budget: budget, palette: palette)
                    .frame(width: 48, height: 48)
            }

            VStack(spacing: 5) {
                ForEach(budget.categories.indices, id: \.self) { index in
                    SpendingCategoryRow(category: budget.categories[index], palette: palette)
                }
            }

            Spacer(minLength: 0)
        }
    }

    private func smallContent(_ budget: BudgetSnapshot) -> some View {
        HStack(alignment: .top, spacing: 12) {
            VStack(alignment: .leading, spacing: 6) {
                Text(entry.strings.budgetTitle)
                    .font(.caption)
                    .foregroundColor(palette.secondary)
                Text(remainingText(budget))
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

                Spacer(minLength: 0)
            }

            SpendingProgressRing(budget: budget, palette: palette)
                .frame(width: 52, height: 52)
        }
    }

    private func remainingText(_ budget: BudgetSnapshot) -> String {
        let amount = budget.formattedRemaining ?? budget.formattedSpent
        let suffix = budget.isOverLimit ? entry.strings.over : entry.strings.left

        return "\(amount) \(suffix)"
    }

    private func paceText(_ budget: BudgetSnapshot) -> String {
        "\(budget.formattedSafePerDay) \(entry.strings.perDay) · \(budget.daysRemaining) \(entry.strings.daysLeft)"
    }
}

struct SpendingWidget: Widget {
    var body: some WidgetConfiguration {
        StaticConfiguration(kind: "BudgieSpending", provider: SnapshotProvider()) { entry in
            SpendingWidgetView(entry: entry, isMedium: false)
        }
        .configurationDisplayName("Budget")
        .description("How much of this period's budget is left.")
        .supportedFamilies([.systemSmall])
    }
}

struct SpendingMediumWidget: Widget {
    var body: some WidgetConfiguration {
        StaticConfiguration(kind: "BudgieSpendingMedium", provider: SnapshotProvider()) { entry in
            SpendingWidgetView(entry: entry, isMedium: true)
        }
        .configurationDisplayName("Budget by category")
        .description("Budget progress with the categories closest to their limit.")
        .supportedFamilies([.systemMedium])
    }
}
