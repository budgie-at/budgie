import { Circle, Svg } from 'react-native-svg';

import { RING_CENTER, RING_CIRCUMFERENCE, RING_RADIUS, RING_SIZE, STROKE_WIDTH } from './animated-record-button.constant';

interface Props {
    readonly stroke: string;
    readonly strokeDasharray?: string;
    readonly strokeDashoffset?: number;
    readonly opacity?: number;
    readonly rotation?: number;
}

const DEFAULT_OPACITY = 1;
const DEFAULT_ROTATION = 0;
const DEFAULT_DASHOFFSET = 0;

export const BaseRing = ({
    stroke,
    strokeDasharray = `${RING_CIRCUMFERENCE}`,
    strokeDashoffset = DEFAULT_DASHOFFSET,
    opacity = DEFAULT_OPACITY,
    rotation = DEFAULT_ROTATION
}: Props) => (
    <Svg width={RING_SIZE} height={RING_SIZE}>
        <Circle
            cx={RING_CENTER}
            cy={RING_CENTER}
            r={RING_RADIUS}
            stroke={stroke}
            strokeWidth={STROKE_WIDTH}
            strokeDasharray={strokeDasharray}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            fill="none"
            opacity={opacity}
            rotation={rotation}
            origin={`${RING_CENTER}, ${RING_CENTER}`}
        />
    </Svg>
);
