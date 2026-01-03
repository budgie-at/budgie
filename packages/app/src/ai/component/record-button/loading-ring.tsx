import { View } from 'react-native';
import { Circle, Svg } from 'react-native-svg';

import {
    LOADING_COLOR,
    RING_CENTER,
    RING_CIRCUMFERENCE,
    RING_RADIUS,
    RING_SIZE,
    STROKE_WIDTH
} from './animated-record-button.constant';
import { ringContainerStyle } from './ring-container.style';

interface Props {
    readonly progress: number;
}

const ROTATION_OFFSET = -90;

export const LoadingRing = ({ progress }: Props) => {
    const strokeDashoffset = RING_CIRCUMFERENCE * (1 - progress);

    return (
        <View style={ringContainerStyle}>
            <Svg width={RING_SIZE} height={RING_SIZE}>
                <Circle
                    cx={RING_CENTER}
                    cy={RING_CENTER}
                    r={RING_RADIUS}
                    stroke={LOADING_COLOR}
                    strokeWidth={STROKE_WIDTH}
                    strokeDasharray={RING_CIRCUMFERENCE}
                    strokeDashoffset={strokeDashoffset}
                    strokeLinecap="round"
                    fill="none"
                    rotation={ROTATION_OFFSET}
                    origin={`${RING_CENTER}, ${RING_CENTER}`}
                />
            </Svg>
        </View>
    );
};
