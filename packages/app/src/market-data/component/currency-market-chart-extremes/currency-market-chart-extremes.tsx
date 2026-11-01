import { useAtomValue } from '@effect/atom-react/Hooks';
import Animated, { useAnimatedStyle } from 'react-native-reanimated';

import { useFormatDigits } from '../../../i18n/hook/use-format-digits.hook';
import { defaultInstrumentAtom } from '../../../settings/constants/settings-atoms.constant';
import { getMarketPriceFractionDigits } from '../../utils/get-market-price-fraction-digits.util';
import { CurrencyMarketChartExtreme } from '../currency-market-chart-extreme/currency-market-chart-extreme';

import type { SharedValue } from 'react-native-reanimated';

interface Props {
    readonly values: readonly number[];
    readonly xs: readonly number[];
    readonly ys: readonly number[];
    readonly chartWidth: number;
    readonly activeIndex: SharedValue<number>;
}

const MIN_FRACTION_DIGITS = 2;
const LABEL_HEIGHT = 13;
const LABEL_GAP = 4;

export const CurrencyMarketChartExtremes = ({ values, xs, ys, chartWidth, activeIndex }: Props) => {
    const { symbol } = useAtomValue(defaultInstrumentAtom);
    const formatPrice = useFormatDigits(MIN_FRACTION_DIGITS, getMarketPriceFractionDigits(values.at(-1) ?? 0));
    const visibilityStyle = useAnimatedStyle(() => ({ opacity: activeIndex.get() < 0 ? 1 : 0 }));

    const high = Math.max(...values);
    const low = Math.min(...values);
    const highIndex = values.indexOf(high);
    const lowIndex = values.indexOf(low);

    const highTop = (ys[highIndex] ?? 0) - LABEL_GAP - LABEL_HEIGHT;
    const lowTop = (ys[lowIndex] ?? 0) + LABEL_GAP;
    const highX = xs[highIndex] ?? 0;
    const lowX = xs[lowIndex] ?? 0;

    if (high === low) {
        return null;
    }

    return (
        <Animated.View pointerEvents="none" className="absolute inset-0" style={visibilityStyle}>
            <CurrencyMarketChartExtreme label={formatPrice(high, symbol)} x={highX} top={highTop} chartWidth={chartWidth} />
            <CurrencyMarketChartExtreme label={formatPrice(low, symbol)} x={lowX} top={lowTop} chartWidth={chartWidth} />
        </Animated.View>
    );
};
