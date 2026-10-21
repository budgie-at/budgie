import type { ReactNode } from 'react';
import type { PressableProps } from 'react-native';

export interface AmountSignTogglePropsInterface extends Omit<PressableProps, 'children'> {
    readonly isNegative: boolean;
    readonly positiveIcon: ReactNode;
    readonly negativeIcon: ReactNode;
}
