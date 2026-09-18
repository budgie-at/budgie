import SwiftUI
import WidgetKit

struct PlaceholderEntry: TimelineEntry {
    let date: Date
    let containerPath: String?
}

struct PlaceholderProvider: TimelineProvider {
    private var containerPath: String? {
        guard let group = Bundle.main.object(forInfoDictionaryKey: "BudgieAppGroup") as? String else {
            return nil
        }

        return FileManager.default
            .containerURL(forSecurityApplicationGroupIdentifier: group)?
            .lastPathComponent
    }

    func placeholder(in context: Context) -> PlaceholderEntry {
        PlaceholderEntry(date: Date(), containerPath: nil)
    }

    func getSnapshot(in context: Context, completion: @escaping (PlaceholderEntry) -> Void) {
        completion(PlaceholderEntry(date: Date(), containerPath: containerPath))
    }

    func getTimeline(in context: Context, completion: @escaping (Timeline<PlaceholderEntry>) -> Void) {
        let entry = PlaceholderEntry(date: Date(), containerPath: containerPath)

        completion(Timeline(entries: [entry], policy: .atEnd))
    }
}

struct PlaceholderWidgetView: View {
    let entry: PlaceholderEntry

    private var statusText: String {
        entry.containerPath == nil ? "No App Group" : "App Group OK"
    }

    var body: some View {
        VStack(alignment: .leading, spacing: 4) {
            Text("Budgie")
                .font(.headline)
            Text(statusText)
                .font(.caption2)
                .foregroundStyle(.secondary)
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .leading)
        .widgetBackground(Color(.systemBackground))
    }
}

struct PlaceholderWidget: Widget {
    var body: some WidgetConfiguration {
        StaticConfiguration(kind: "BudgiePlaceholder", provider: PlaceholderProvider()) { entry in
            PlaceholderWidgetView(entry: entry)
        }
        .configurationDisplayName("Budgie")
        .description("Placeholder while the widgets are built.")
        .supportedFamilies([.systemSmall])
    }
}
