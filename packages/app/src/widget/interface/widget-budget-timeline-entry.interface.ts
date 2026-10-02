import type { WidgetBudgetSnapshotInterface } from './widget-budget-snapshot.interface';

export interface WidgetBudgetTimelineEntryInterface {
    readonly date: Date;
    readonly budget: WidgetBudgetSnapshotInterface;
}
