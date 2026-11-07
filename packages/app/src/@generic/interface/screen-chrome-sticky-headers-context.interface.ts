import type { ScreenChromeStickyHeaderMetricInterface } from './screen-chrome-sticky-header-metric.interface';
import type { ScreenChromeStickyHeaderSourceInterface } from './screen-chrome-sticky-header-source.interface';
import type { ScreenChromeStickyHeaderStateInterface } from './screen-chrome-sticky-header-state.interface';
import type { Dispatch, SetStateAction } from 'react';
import type { DerivedValue, SharedValue } from 'react-native-reanimated';

export interface ScreenChromeStickyHeadersContextInterface {
    readonly setSource: Dispatch<SetStateAction<ScreenChromeStickyHeaderSourceInterface | null>>;
    readonly metrics: SharedValue<readonly ScreenChromeStickyHeaderMetricInterface[]>;
    readonly viewportTop: SharedValue<number>;
    readonly headerBottom: SharedValue<number>;
    readonly protectedBottom: SharedValue<number>;
    readonly anchor: DerivedValue<number>;
    readonly state: DerivedValue<ScreenChromeStickyHeaderStateInterface>;
}
