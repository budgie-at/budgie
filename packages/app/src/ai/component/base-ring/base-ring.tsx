import { Svg } from 'react-native-svg';

import { StyledCircle } from '../../../@generic/component/styled-circle/styled-circle';
import { RING_CENTER, RING_CIRCUMFERENCE, RING_RADIUS, RING_SIZE, STROKE_WIDTH } from '../../constant/animated-record-button.constant';

interface Props {
    readonly strokeClassName: string;
    readonly strokeDasharray?: string;
    readonly strokeDashoffset?: number;
    readonly opacity?: number;
    readonly rotation?: number;
}

const DEFAULT_OPACITY = 1;
const DEFAULT_ROTATION = 0;
const DEFAULT_DASHOFFSET = 0;

export const BaseRing = ({
    strokeClassName,
    strokeDasharray = `${RING_CIRCUMFERENCE}`,
    strokeDashoffset = DEFAULT_DASHOFFSET,
    opacity = DEFAULT_OPACITY,
    rotation = DEFAULT_ROTATION
}: Props) => (
    <Svg width={RING_SIZE} height={RING_SIZE}>
        <StyledCircle
            cx={RING_CENTER}
            cy={RING_CENTER}
            r={RING_RADIUS}
            strokeClassName={strokeClassName}
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
