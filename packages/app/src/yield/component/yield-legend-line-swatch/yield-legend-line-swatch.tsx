import Svg from 'react-native-svg';

import { StyledLine } from '../../../@generic/component/styled-line/styled-line';

interface Props {
    readonly strokeClassName: string;
    readonly strokeWidth: number;
    readonly dash?: string;
    readonly length?: number;
}

const DEFAULT_LENGTH = 16;
const SWATCH_HEIGHT = 14;
const HALF = 2;

export const YieldLegendLineSwatch = ({ strokeClassName, strokeWidth, dash, length = DEFAULT_LENGTH }: Props) => {
    const middle = SWATCH_HEIGHT / HALF;

    return (
        <Svg width={length} height={SWATCH_HEIGHT} importantForAccessibility="no-hide-descendants">
            <StyledLine
                x1={0}
                y1={middle}
                x2={length}
                y2={middle}
                strokeClassName={strokeClassName}
                strokeWidth={strokeWidth}
                strokeDasharray={dash}
                strokeLinecap="round"
            />
        </Svg>
    );
};
