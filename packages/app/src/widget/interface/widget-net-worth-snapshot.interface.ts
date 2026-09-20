import type { WidgetDeltaDirectionEnum } from '../enum/widget-delta-direction.enum';
import type { WidgetAccountTypeTotalInterface } from './widget-account-type-total.interface';

export interface WidgetNetWorthSnapshotInterface {
    readonly formattedTotal: string;
    readonly formattedDelta: string;
    readonly deltaDirection: WidgetDeltaDirectionEnum;
    readonly accountTypes: readonly WidgetAccountTypeTotalInterface[];
}
