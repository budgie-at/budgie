import SwiftUI
import WidgetKit

struct RunwayEntry: TimelineEntry {
    let date: Date
    let snapshot: WidgetSnapshot?

    var strings: WidgetStrings {
        snapshot?.strings ?? SnapshotStore.fallbackStrings
    }
}

struct RunwayProvider: TimelineProvider {
    func placeholder(in context: Context) -> RunwayEntry {
        RunwayEntry(date: Date(), snapshot: nil)
    }

    func getSnapshot(in context: Context, completion: @escaping (RunwayEntry) -> Void) {
        completion(RunwayEntry(date: Date(), snapshot: SnapshotStore.load()))
    }

    func getTimeline(in context: Context, completion: @escaping (Timeline<RunwayEntry>) -> Void) {
        let now = Date()
        let snapshot = SnapshotStore.load()
        let nextMidnight = Calendar.current.nextDate(
            after: now,
            matching: DateComponents(hour: 0, minute: 0),
            matchingPolicy: .nextTime
        ) ?? now.addingTimeInterval(3600)

        completion(
            Timeline(
                entries: [RunwayEntry(date: now, snapshot: snapshot), RunwayEntry(date: nextMidnight, snapshot: snapshot)],
                policy: .atEnd
            )
        )
    }
}

struct RunwayWidgetView: View {
    let entry: RunwayEntry

    @Environment(\.colorScheme) private var colorScheme

    private var palette: WidgetPalette {
        WidgetPalette(snapshot: entry.snapshot, colorScheme: colorScheme)
    }

    var body: some View {
        content
            .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .leading)
            .widgetBackground(palette.background)
            .widgetURL(WidgetLinks.route("analytics?tab=runway"))
            .environment(\.locale, Locale(identifier: entry.snapshot?.locale ?? "en-US"))
    }

    @ViewBuilder
    private var content: some View {
        if let runway = entry.snapshot?.runway {
            VStack(alignment: .leading, spacing: 6) {
                Text(entry.strings.runwayTitle)
                    .font(.caption)
                    .foregroundColor(palette.secondary)
                HStack(spacing: 4) {
                    Image(systemName: runway.isPositive ? "chart.line.uptrend.xyaxis" : "chart.line.downtrend.xyaxis")
                        .font(.caption)
                        .foregroundColor(runway.isPositive ? palette.positive : palette.warning)
                    Text(runway.label)
                        .font(.footnote.weight(.semibold))
                        .foregroundColor(runway.isPositive ? palette.positive : palette.warning)
                        .minimumScaleFactor(0.5)
                        .lineLimit(1)
                }
                .privacySensitive()
            }
        } else {
            WidgetEmptyState(message: entry.strings.notEnoughData, palette: palette)
        }
    }
}

struct RunwayWidget: Widget {
    var body: some WidgetConfiguration {
        StaticConfiguration(kind: "BudgieRunway", provider: RunwayProvider()) { entry in
            RunwayWidgetView(entry: entry)
        }
        .configurationDisplayName("Runway")
        .description("Whether you are growing or burning, and for how long.")
        .supportedFamilies([.systemSmall])
    }
}
