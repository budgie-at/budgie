import { useAtomValue } from '@effect/atom-react/Hooks';
import { useLingui } from '@lingui/react/macro';
import Animated, { useAnimatedStyle } from 'react-native-reanimated';

import { isDefined } from '@rnw-community/shared';

import { useFormatDigits } from '../../../i18n/hook/use-format-digits.hook';
import { defaultInstrumentAtom } from '../../../settings/constants/settings-atoms.constant';
import { getMarketChartOpenLabelTop } from '../../utils/get-market-chart-open-label-top.util';
import { getMarketPriceFractionDigits } from '../../utils/get-market-price-fraction-digits.util';

import type { SharedValue } from 'react-native-reanimated';

interface Props {
    readonly values: readonly number[];
    readonly xs: readonly number[];
    readonly ys: readonly number[];
    readonly chartWidth: number;
    readonly baselineY: number;
    readonly activeIndex: SharedValue<number>;
}

const MIN_FRACTION_DIGITS = 2;

export const CurrencyMarketChartOpenLabel = ({ values, xs, ys, baselineY, chartWidth, activeIndex }: Props) => {
    const { t } = useLingui();
    const { symbol } = useAtomValue(defaultInstrumentAtom);
    const formatPrice = useFormatDigits(MIN_FRACTION_DIGITS, getMarketPriceFractionDigits(values.at(-1) ?? 0));
    const openPrice = formatPrice(values.at(0) ?? 0, symbol);
    const label = t`Open ${openPrice}`;
    const top = getMarketChartOpenLabelTop({ values, xs, ys, baselineY, chartWidth, labelLength: label.length });
    const visibilityStyle = useAnimatedStyle(() => ({ top: top ?? 0, opacity: activeIndex.get() < 0 && isDefined(top) ? 1 : 0 }));

    return (
        <Animated.Text
            pointerEvents="none"
            numberOfLines={1}
            className="absolute right-0 text-right text-[11px] leading-[14px] text-secondary-foreground tabular-nums"
            style={visibilityStyle}
        >
            {label}
        </Animated.Text>
    );
};
