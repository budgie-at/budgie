import type { WidgetDeltaDirectionEnum } from '../enum/widget-delta-direction.enum';

export interface WidgetNetWorthSnapshotInterface {
    readonly formattedTotal: string;
    readonly formattedDelta: string;
    readonly deltaDirection: WidgetDeltaDirectionEnum;
    readonly formattedFiat: string;
    readonly formattedCrypto: string;
    readonly hasCrypto: boolean;
    readonly history: readonly number[];
}
