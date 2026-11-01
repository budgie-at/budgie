import { useAtomValue } from '@effect/atom-react/Hooks';
import { useLingui } from '@lingui/react/macro';

import { useFormatDigits } from '../../i18n/hook/use-format-digits.hook';
import { defaultInstrumentAtom } from '../../settings/constants/settings-atoms.constant';
import { getMarketPriceFractionDigits } from '../utils/get-market-price-fraction-digits.util';

const MIN_FRACTION_DIGITS = 2;

export const useMarketChartAccessibilityLabel = (values: readonly number[], rangeLabel: string): string => {
    const { t } = useLingui();
    const { symbol } = useAtomValue(defaultInstrumentAtom);
    const formatPrice = useFormatDigits(MIN_FRACTION_DIGITS, getMarketPriceFractionDigits(values.at(-1) ?? 0));

    const fromLabel = formatPrice(values.at(0) ?? 0, symbol);
    const toLabel = formatPrice(values.at(-1) ?? 0, symbol);
    const highLabel = formatPrice(Math.max(...values), symbol);
    const lowLabel = formatPrice(Math.min(...values), symbol);

    return t`Price chart, ${rangeLabel}, from ${fromLabel} to ${toLabel}, high ${highLabel}, low ${lowLabel}`;
};
