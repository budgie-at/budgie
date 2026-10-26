import type { ReactNode } from 'react';
import type { ViewProps } from 'react-native';

export interface AmountFieldPropsInterface extends ViewProps {
    readonly fontSize: number;
    readonly minimumFontScale?: number;
    readonly children: ReactNode;
}
