import { useAtomValue } from '@effect/atom-react/Hooks';
import { useLingui } from '@lingui/react/macro';
import { parseISO } from 'date-fns/parseISO';

import { useFormatDate } from '../../i18n/hook/use-format-date.hook';
import { useFormatDigits } from '../../i18n/hook/use-format-digits.hook';
import { defaultInstrumentAtom } from '../../settings/constants/settings-atoms.constant';
import { getMarketPriceFractionDigits } from '../utils/get-market-price-fraction-digits.util';

import type { InstrumentDailyMarketPriceEntityInterface } from '@budgie/contracts';
import type { AccessibilityActionEvent } from 'react-native';

const MIN_FRACTION_DIGITS = 2;
const ACCESSIBILITY_ACTIONS = [{ name: 'increment' }, { name: 'decrement' }];

export const useMarketChartAccessibility = (
    prices: readonly Pick<InstrumentDailyMarketPriceEntityInterface, 'price' | 'priceDate'>[],
    rangeLabel: string,
    selectedIndex: number | null,
    onSelect: (index: number) => void
) => {
    const { t } = useLingui();
    const values = prices.map(price => price.price);
    const { symbol } = useAtomValue(defaultInstrumentAtom);
    const { formatDayAndMonthAndYear } = useFormatDate();
    const formatPrice = useFormatDigits(MIN_FRACTION_DIGITS, getMarketPriceFractionDigits(values.at(-1) ?? 0));

    const fromLabel = formatPrice(values.at(0) ?? 0, symbol);
    const toLabel = formatPrice(values.at(-1) ?? 0, symbol);
    const highLabel = formatPrice(Math.max(...values), symbol);
    const lowLabel = formatPrice(Math.min(...values), symbol);
    const currentIndex = Math.min(selectedIndex ?? values.length - 1, values.length - 1);
    const dateLabel = formatDayAndMonthAndYear(parseISO(prices.at(currentIndex)?.priceDate ?? ''));
    const priceLabel = formatPrice(values.at(currentIndex) ?? 0, symbol);

    const accessibilityLabel = t`Price chart, ${rangeLabel}, from ${fromLabel} to ${toLabel}, high ${highLabel}, low ${lowLabel}`;

    const handleAccessibilityAction = (event: AccessibilityActionEvent) => {
        const step = event.nativeEvent.actionName === 'increment' ? 1 : -1;

        onSelect(Math.min(Math.max(currentIndex + step, 0), values.length - 1));
    };

    return {
        accessible: true,
        accessibilityRole: 'adjustable',
        accessibilityLabel,
        accessibilityValue: { text: t`${dateLabel}, ${priceLabel}` },
        accessibilityActions: ACCESSIBILITY_ACTIONS,
        onAccessibilityAction: handleAccessibilityAction
    } as const;
};
