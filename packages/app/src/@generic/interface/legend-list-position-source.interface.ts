import type { LegendListState } from '@legendapp/list/react-native';

export interface LegendListPositionSourceInterface {
    readonly getState: () => Pick<LegendListState, 'positionAtIndex'>;
}
