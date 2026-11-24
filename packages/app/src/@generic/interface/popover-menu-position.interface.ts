import type { ViewStyle } from 'react-native';

export interface PopoverMenuPositionInterface {
    readonly menuContainerStyle: ViewStyle;
    readonly menuTransformOrigin: string;
    readonly isMeasuring: boolean;
    readonly measuringStyle: ViewStyle | null;
    readonly measuringPointerEvents: 'none' | 'auto';
    readonly measuringImportantForAccessibility: 'no-hide-descendants' | 'auto';
}
