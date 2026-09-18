import SwiftUI
import WidgetKit

struct NetWorthEntry: TimelineEntry {
    let date: Date
    let snapshot: WidgetSnapshot?

    var strings: WidgetStrings {
        snapshot?.strings ?? SnapshotStore.fallbackStrings
    }
}

struct NetWorthProvider: TimelineProvider {
    func placeholder(in context: Context) -> NetWorthEntry {
        NetWorthEntry(date: Date(), snapshot: nil)
    }

    func getSnapshot(in context: Context, completion: @escaping (NetWorthEntry) -> Void) {
        completion(NetWorthEntry(date: Date(), snapshot: SnapshotStore.load()))
    }

    func getTimeline(in context: Context, completion: @escaping (Timeline<NetWorthEntry>) -> Void) {
        let now = Date()
        let snapshot = SnapshotStore.load()
        let nextMidnight = Calendar.current.nextDate(
            after: now,
            matching: DateComponents(hour: 0, minute: 0),
            matchingPolicy: .nextTime
        ) ?? now.addingTimeInterval(3600)

        completion(
            Timeline(
                entries: [NetWorthEntry(date: now, snapshot: snapshot), NetWorthEntry(date: nextMidnight, snapshot: snapshot)],
                policy: .atEnd
            )
        )
    }
}

struct NetWorthDeltaText: View {
    let netWorth: NetWorthSnapshot
    let label: String
    let palette: WidgetPalette

    private var deltaColor: Color {
        switch netWorth.deltaDirection {
        case "UP":
            return palette.positive
        case "DOWN":
            return palette.destructive
        default:
            return palette.secondary
        }
    }

    var body: some View {
        HStack(spacing: 4) {
            Text(netWorth.formattedDelta)
                .font(.caption)
                .foregroundColor(deltaColor)
            Text(label)
                .font(.caption)
                .foregroundColor(palette.secondary)
        }
    }
}

struct NetWorthRunwayRow: View {
    let runway: RunwaySnapshot
    let palette: WidgetPalette

    private var accent: Color {
        runway.isPositive ? palette.positive : palette.warning
    }

    var body: some View {
        HStack(spacing: 4) {
            Image(systemName: runway.isPositive ? "chart.line.uptrend.xyaxis" : "chart.line.downtrend.xyaxis")
                .font(.caption2)
                .foregroundColor(accent)
            Text(runway.label)
                .font(.caption.weight(.medium))
                .foregroundColor(accent)
                .minimumScaleFactor(0.6)
                .lineLimit(1)
        }
    }
}

struct NetWorthSplitRow: View {
    let title: String
    let value: String
    let palette: WidgetPalette

    var body: some View {
        HStack {
            Text(title)
                .font(.caption)
                .foregroundColor(palette.secondary)
            Spacer()
            Text(value)
                .font(.caption)
                .foregroundColor(palette.primary)
        }
    }
}

struct NetWorthWidgetView: View {
    let entry: NetWorthEntry
    let isMedium: Bool

    @Environment(\.colorScheme) private var colorScheme

    private var palette: WidgetPalette {
        WidgetPalette(snapshot: entry.snapshot, colorScheme: colorScheme)
    }

    var body: some View {
        content
            .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .leading)
            .widgetBackground(palette.background)
            .widgetURL(WidgetLinks.home)
            .environment(\.locale, Locale(identifier: entry.snapshot?.locale ?? "en-US"))
    }

    @ViewBuilder
    private var content: some View {
        if let netWorth = entry.snapshot?.netWorth {
            VStack(alignment: .leading, spacing: 6) {
                Text(entry.strings.netWorthTitle)
                    .font(.caption)
                    .foregroundColor(palette.secondary)
                Text(netWorth.formattedTotal)
                    .font(.title2.weight(.semibold))
                    .foregroundColor(palette.primary)
                    .minimumScaleFactor(0.6)
                    .lineLimit(1)
                    .privacySensitive()

                if let runway = entry.snapshot?.runway {
                    NetWorthRunwayRow(runway: runway, palette: palette)
                        .privacySensitive()
                }

                if isMedium {
                    NetWorthDeltaText(netWorth: netWorth, label: entry.strings.thisMonth, palette: palette)
                        .privacySensitive()
                    Spacer(minLength: 2)
                    NetWorthSplitRow(title: entry.strings.fiat, value: netWorth.formattedFiat, palette: palette)
                        .privacySensitive()

                    if netWorth.hasCrypto {
                        NetWorthSplitRow(title: entry.strings.crypto, value: netWorth.formattedCrypto, palette: palette)
                            .privacySensitive()
                    }
                }
            }
        } else {
            WidgetEmptyState(message: entry.strings.empty, palette: palette)
        }
    }
}

struct NetWorthWidget: Widget {
    var body: some WidgetConfiguration {
        StaticConfiguration(kind: "BudgieNetWorth", provider: NetWorthProvider()) { entry in
            NetWorthWidgetView(entry: entry, isMedium: false)
        }
        .configurationDisplayName("Net worth")
        .description("Your total balance, and whether you are growing or burning.")
        .supportedFamilies([.systemSmall])
    }
}

struct NetWorthMediumWidget: Widget {
    var body: some WidgetConfiguration {
        StaticConfiguration(kind: "BudgieNetWorthMedium", provider: NetWorthProvider()) { entry in
            NetWorthWidgetView(entry: entry, isMedium: true)
        }
        .configurationDisplayName("Net worth breakdown")
        .description("Your balance and runway, split by cash and crypto.")
        .supportedFamilies([.systemMedium])
    }
}
