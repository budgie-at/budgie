import type { WidgetAccountTypeTotalInterface } from './widget-account-type-total.interface';

export interface WidgetNetWorthSnapshotInterface {
    readonly formattedTotal: string;
    readonly formattedDelta: string;
    readonly deltaColor: string;
    readonly accountTypes: readonly WidgetAccountTypeTotalInterface[];
}
