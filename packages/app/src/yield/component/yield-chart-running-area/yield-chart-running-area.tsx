import { Defs, LinearGradient, Stop } from 'react-native-svg';
import { useCSSVariable } from 'uniwind';

import { isString } from '@rnw-community/shared';

import { StyledPath } from '../../../@generic/component/styled-path/styled-path';

interface Props {
    readonly path: string;
}

const AREA_TOP_OPACITY = 0.12;
const AREA_FALLBACK_OPACITY = 0.08;
const AREA_GRADIENT_ID = 'yield-running-total-area';

export const YieldChartRunningArea = ({ path }: Props) => {
    const lineColor = useCSSVariable('--color-positive-action');

    if (!isString(lineColor)) {
        return <StyledPath d={path} fillClassName="accent-positive-action" fillOpacity={AREA_FALLBACK_OPACITY} />;
    }

    return (
        <>
            <Defs>
                <LinearGradient id={AREA_GRADIENT_ID} x1="0" y1="0" x2="0" y2="1">
                    <Stop offset="0" stopColor={lineColor} stopOpacity={AREA_TOP_OPACITY} />
                    <Stop offset="1" stopColor={lineColor} stopOpacity={0} />
                </LinearGradient>
            </Defs>
            <StyledPath d={path} fill={`url(#${AREA_GRADIENT_ID})`} />
        </>
    );
};
