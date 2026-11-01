import { useAtomValue } from '@effect/atom-react/Hooks';
import { useLingui } from '@lingui/react/macro';
import Animated, { useAnimatedStyle } from 'react-native-reanimated';

import { useFormatDigits } from '../../../i18n/hook/use-format-digits.hook';
import { defaultInstrumentAtom } from '../../../settings/constants/settings-atoms.constant';
import { MARKET_CHART_PLOT_HEIGHT } from '../../constant/market-chart-plot-height.constant';
import { getMarketChartExtremeTops } from '../../utils/get-market-chart-extreme-tops.util';
import { getMarketPriceFractionDigits } from '../../utils/get-market-price-fraction-digits.util';

import type { SharedValue } from 'react-native-reanimated';

interface Props {
    readonly values: readonly number[];
    readonly ys: readonly number[];
    readonly baselineY: number;
    readonly activeIndex: SharedValue<number>;
}

const MIN_FRACTION_DIGITS = 2;
const LABEL_HEIGHT = 14;
const LINE_GAP = 2;
const EXTREME_CLEARANCE = 16;

export const CurrencyMarketChartOpenLabel = ({ values, ys, baselineY, activeIndex }: Props) => {
    const { t } = useLingui();
    const { symbol } = useAtomValue(defaultInstrumentAtom);
    const formatPrice = useFormatDigits(MIN_FRACTION_DIGITS, getMarketPriceFractionDigits(values.at(-1) ?? 0));
    const { highTop, lowTop } = getMarketChartExtremeTops(values, ys);

    const top = Math.min(Math.max(baselineY - LINE_GAP - LABEL_HEIGHT, 0), MARKET_CHART_PLOT_HEIGHT - LABEL_HEIGHT);
    const hasExtremes = Math.max(...values) !== Math.min(...values);
    const isCrowded = hasExtremes && (Math.abs(top - highTop) < EXTREME_CLEARANCE || Math.abs(top - lowTop) < EXTREME_CLEARANCE);
    const openPrice = formatPrice(values.at(0) ?? 0, symbol);
    const visibilityStyle = useAnimatedStyle(() => ({ top, opacity: activeIndex.get() < 0 && !isCrowded ? 1 : 0 }));

    return (
        <Animated.Text
            pointerEvents="none"
            numberOfLines={1}
            className="absolute right-0 text-right text-[11px] leading-[14px] text-secondary-foreground tabular-nums"
            style={visibilityStyle}
        >
            {t`Open ${openPrice}`}
        </Animated.Text>
    );
};
