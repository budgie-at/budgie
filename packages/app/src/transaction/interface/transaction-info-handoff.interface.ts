import type { DerivedValue } from 'react-native-reanimated';

export interface TransactionInfoHandoffInterface {
    readonly compactTitleRange: DerivedValue<readonly [number, number]>;
    readonly compactAmountRange: DerivedValue<readonly [number, number]>;
}
