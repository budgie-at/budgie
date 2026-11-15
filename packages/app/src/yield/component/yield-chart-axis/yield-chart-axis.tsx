import { useAtomValue } from '@effect/atom-react/Hooks';

import { StyledLine } from '../../../@generic/component/styled-line/styled-line';
import { StyledSvgText } from '../../../@generic/component/styled-svg-text/styled-svg-text';
import { useIsAmountProtected } from '../../../@generic/hook/use-is-amount-protected.hook';
import { THOUSAND } from '../../../i18n/constant/compact-thresholds.constant';
import { useFormatCompactDigits } from '../../../i18n/hook/use-format-compact-digits.hook';
import { defaultInstrumentAtom } from '../../../settings/constants/settings-atoms.constant';

import type { YieldAxisInterface } from '../../interface/yield-axis.interface';

interface Props {
    readonly axis: YieldAxisInterface;
    readonly width: number;
    readonly height: number;
}

const LABEL_INSET = 4;
const LABEL_BASELINE_OFFSET = 4;
const TOP_LABEL_BASELINE = 12;
const LABEL_FONT_SIZE = 11;
const GRID_DASH = '2 4';
const GRID_TOP = 1;
const LINE_WIDTH = 1;

export const YieldChartAxis = ({ axis, width, height }: Props) => {
    const isAmountProtected = useIsAmountProtected();
    const formatCompact = useFormatCompactDigits(THOUSAND);
    const { symbol } = useAtomValue(defaultInstrumentAtom);

    const zeroY = (axis.top * height) / (axis.top - axis.bottom);
    const labelX = width - LABEL_INSET;
    const zeroLabelY = zeroY - LABEL_BASELINE_OFFSET;

    return (
        <>
            <StyledLine x1={0} y1={zeroY} x2={width} y2={zeroY} strokeClassName="accent-secondary-foreground" strokeWidth={LINE_WIDTH} />
            <StyledLine
                x1={0}
                y1={GRID_TOP}
                x2={width}
                y2={GRID_TOP}
                strokeClassName="accent-secondary-foreground"
                strokeWidth={LINE_WIDTH}
                strokeDasharray={GRID_DASH}
            />
            {isAmountProtected ? null : (
                <>
                    <StyledSvgText
                        x={labelX}
                        y={zeroLabelY}
                        textAnchor="end"
                        fontSize={LABEL_FONT_SIZE}
                        fillClassName="accent-secondary-foreground"
                    >
                        {formatCompact(0, symbol)}
                    </StyledSvgText>
                    <StyledSvgText
                        x={labelX}
                        y={TOP_LABEL_BASELINE}
                        textAnchor="end"
                        fontSize={LABEL_FONT_SIZE}
                        fillClassName="accent-secondary-foreground"
                    >
                        {formatCompact(axis.top, symbol)}
                    </StyledSvgText>
                </>
            )}
        </>
    );
};
