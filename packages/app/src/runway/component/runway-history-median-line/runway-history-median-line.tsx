import { useLingui } from '@lingui/react/macro';
import { Line, Rect, Text as SvgText } from 'react-native-svg';

import { isDefined, isPositiveNumber } from '@rnw-community/shared';

import { convertFromMicroUnits } from '../../../@generic/utils/convert-from-micro-units.util';
import { useFormatDigits } from '../../../i18n/hook/use-format-digits.hook';
import { useSettingsContext } from '../../../settings/context/settings.context';
import { useThemeContext } from '../../../theme/context/theme.context';
import { RUNWAY_CHART_COLORS } from '../../constant/runway-chart-colors.constant';
import {
    RUNWAY_HISTORY_BAR_AREA_HEIGHT,
    RUNWAY_HISTORY_CHART_WIDTH,
    RUNWAY_HISTORY_PLOT_TOP
} from '../../constant/runway-history.constant';

interface Props {
    readonly value: number;
    readonly maxValue: number;
    readonly lastMonth: { readonly expense: number; readonly income: number } | undefined;
}

const MEDIAN_DASH = '2 3';
const LABEL_FONT_SIZE = 8;
const LABEL_GAP = 4;
const LABEL_CHAR_WIDTH = 4.4;
const LABEL_PADDING = 3;
const BACKDROP_RADIUS = 2;
const LABEL_X = RUNWAY_HISTORY_CHART_WIDTH - LABEL_PADDING;

export const RunwayHistoryMedianLine = ({ value, maxValue, lastMonth }: Props) => {
    const { t } = useLingui();
    const { decimalPlaces, defaultInstrument } = useSettingsContext();
    const formatDigits = useFormatDigits(decimalPlaces);
    const colors = RUNWAY_CHART_COLORS[useThemeContext().colorScheme];
    const ratio = isPositiveNumber(maxValue) ? Math.min(value / maxValue, 1) : 0;
    const medianY = RUNWAY_HISTORY_PLOT_TOP + RUNWAY_HISTORY_BAR_AREA_HEIGHT * (1 - ratio);
    const amount = formatDigits(convertFromMicroUnits(value), defaultInstrument.symbol);
    const label = t`typical month ${amount}`;
    const backdropWidth = label.length * LABEL_CHAR_WIDTH + LABEL_PADDING * 2;
    const backdropHeight = LABEL_FONT_SIZE + LABEL_PADDING;
    const isLastBarTaller = isDefined(lastMonth) && (lastMonth.expense > value || lastMonth.income > value);
    const backdropY = isLastBarTaller ? medianY + LABEL_GAP : medianY - LABEL_GAP - backdropHeight;
    const labelY = backdropY + backdropHeight - LABEL_PADDING;
    const backdropX = RUNWAY_HISTORY_CHART_WIDTH - backdropWidth;

    return (
        <>
            <Rect
                x={backdropX}
                y={backdropY}
                width={backdropWidth}
                height={backdropHeight}
                rx={BACKDROP_RADIUS}
                fill={colors.markerBackground}
            />
            <Line
                x1={0}
                y1={medianY}
                x2={RUNWAY_HISTORY_CHART_WIDTH}
                y2={medianY}
                stroke={colors.median}
                strokeDasharray={MEDIAN_DASH}
                strokeWidth={1}
            />
            <SvgText x={LABEL_X} y={labelY} fill={colors.label} fontSize={LABEL_FONT_SIZE} fontWeight="600" textAnchor="end">
                {label}
            </SvgText>
        </>
    );
};
