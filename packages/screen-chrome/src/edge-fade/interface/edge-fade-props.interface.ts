import { BlurMethod } from 'expo-blur';
import { StyleProp, ViewStyle } from 'react-native';

import { EdgeFadePosition } from '../../interface/screen-chrome-config.interface';

export interface EdgeFadeScrollAnimationInterface {
    readonly opacityInputRange?: readonly [number, number];
    readonly intensityInputRange?: readonly [number, number];
    readonly maxIntensity?: number;
}

export interface EdgeFadePropsInterface {
    readonly position: EdgeFadePosition;
    readonly height?: number;
    readonly intensity?: number;
    readonly scrollAnimation?: EdgeFadeScrollAnimationInterface;
    readonly blurMethod?: BlurMethod;
    readonly style?: StyleProp<ViewStyle>;
}
