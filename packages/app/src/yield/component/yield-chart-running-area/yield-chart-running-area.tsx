import { Defs, G, LinearGradient, Mask, Rect, Stop } from 'react-native-svg';
import { useCSSVariable } from 'uniwind';

import { isDefined, isString } from '@rnw-community/shared';

import { StyledPath } from '../../../@generic/component/styled-path/styled-path';
import { YIELD_PLOT_HEIGHT } from '../../constant/yield-plot-height.constant';

interface Props {
    readonly path: string;
    readonly width: number;
    readonly fadeStartX: number | null;
    readonly fadeEndX: number;
}

const AREA_TOP_OPACITY = 0.12;
const AREA_FALLBACK_OPACITY = 0.08;
const AREA_GRADIENT_ID = 'yield-running-total-area';
const FADE_GRADIENT_ID = 'yield-running-total-fade';
const FADE_MASK_ID = 'yield-running-total-fade-mask';
const MASK_REFERENCE = `url(#${FADE_MASK_ID})`;

export const YieldChartRunningArea = ({ path, width, fadeStartX, fadeEndX }: Props) => {
    const lineColor = useCSSVariable('--color-positive-action');

    const hasFade = isDefined(fadeStartX);
    const fill = isString(lineColor) ? (
        <StyledPath d={path} fill={`url(#${AREA_GRADIENT_ID})`} />
    ) : (
        <StyledPath d={path} fillClassName="accent-positive-action" fillOpacity={AREA_FALLBACK_OPACITY} />
    );

    return (
        <>
            <Defs>
                {isString(lineColor) ? (
                    <LinearGradient id={AREA_GRADIENT_ID} x1="0" y1="0" x2="0" y2="1">
                        <Stop offset="0" stopColor={lineColor} stopOpacity={AREA_TOP_OPACITY} />
                        <Stop offset="1" stopColor={lineColor} stopOpacity={0} />
                    </LinearGradient>
                ) : null}
                {hasFade ? (
                    <>
                        <LinearGradient id={FADE_GRADIENT_ID} gradientUnits="userSpaceOnUse" x1={fadeStartX} y1="0" x2={fadeEndX} y2="0">
                            <Stop offset="0" stopColor="white" stopOpacity={1} />
                            <Stop offset="1" stopColor="white" stopOpacity={0} />
                        </LinearGradient>
                        <Mask id={FADE_MASK_ID} maskUnits="userSpaceOnUse" x="0" y="0" width={width} height={YIELD_PLOT_HEIGHT}>
                            <Rect x="0" y="0" width={width} height={YIELD_PLOT_HEIGHT} fill={`url(#${FADE_GRADIENT_ID})`} />
                        </Mask>
                    </>
                ) : null}
            </Defs>
            {hasFade ? <G mask={MASK_REFERENCE}>{fill}</G> : fill}
        </>
    );
};
