import type { WidgetBudgetTimelineEntryInterface } from './widget-budget-timeline-entry.interface';
import type { WidgetNetWorthSnapshotInterface } from './widget-net-worth-snapshot.interface';
import type { WidgetSnapshotStringsInterface } from './widget-snapshot-strings.interface';

export interface WidgetSnapshotInterface {
    readonly strings: WidgetSnapshotStringsInterface;
    readonly netWorth: WidgetNetWorthSnapshotInterface | null;
    readonly budget: readonly WidgetBudgetTimelineEntryInterface[] | null;
}
