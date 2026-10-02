import type { WidgetAccountTypeTotalInterface } from './widget-account-type-total.interface';
import type { WidgetRunwaySnapshotInterface } from './widget-runway-snapshot.interface';

export interface WidgetNetWorthSnapshotInterface {
    readonly formattedTotal: string;
    readonly formattedDelta: string;
    readonly deltaColor: string;
    readonly accountTypes: readonly WidgetAccountTypeTotalInterface[];
    readonly runway: WidgetRunwaySnapshotInterface;
}
