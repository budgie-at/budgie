import { Defs, LinearGradient, Mask, Rect, Stop } from 'react-native-svg';
import { useCSSVariable } from 'uniwind';

import { isString } from '@rnw-community/shared';

import { StyledPath } from '../../../@generic/component/styled-path/styled-path';

interface Props {
    readonly path: string;
    readonly endX: number;
}

const AREA_TOP_OPACITY = 0.12;
const AREA_FALLBACK_OPACITY = 0.08;
const AREA_GRADIENT_ID = 'yield-running-total-area';
const AREA_FADE_GRADIENT_ID = 'yield-running-total-area-fade';
const AREA_MASK_ID = 'yield-running-total-area-mask';
const END_FADE_WIDTH = 32;

export const YieldChartRunningArea = ({ path, endX }: Props) => {
    const lineColor = useCSSVariable('--color-positive-action');
    const fadeStartX = endX - END_FADE_WIDTH;

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
                <LinearGradient id={AREA_FADE_GRADIENT_ID} gradientUnits="userSpaceOnUse" x1={fadeStartX} y1="0" x2={endX} y2="0">
                    <Stop offset="0" stopColor="white" stopOpacity={1} />
                    <Stop offset="1" stopColor="white" stopOpacity={0} />
                </LinearGradient>
                <Mask id={AREA_MASK_ID} maskUnits="userSpaceOnUse" x="0" y="0" width="100%" height="100%">
                    <Rect x="0" y="0" width="100%" height="100%" fill={`url(#${AREA_FADE_GRADIENT_ID})`} />
                </Mask>
            </Defs>
            <StyledPath d={path} fill={`url(#${AREA_GRADIENT_ID})`} mask={`url(#${AREA_MASK_ID})`} />
        </>
    );
};
