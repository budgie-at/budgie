import { useAtomValue } from '@effect/atom-react/Hooks';

import { useFormatDigits } from '../../i18n/hook/use-format-digits.hook';
import { useLocaleInfo } from '../../i18n/hook/use-locale-info.hook';
import { decimalPlacesAtom } from '../../settings/constants/settings-atoms.constant';

import type { AmountFormatInterface } from '@budgie/amount-input';

export const useAmountFormat = (minimumDecimalPlaces: number, prefix = ''): AmountFormatInterface => {
    const { decimalSeparator, digitGroupingSeparator } = useLocaleInfo();
    const decimalPlaces = useAtomValue(decimalPlacesAtom);
    const visibleDecimalPlaces = Math.max(decimalPlaces, minimumDecimalPlaces);
    const formatDigits = useFormatDigits(visibleDecimalPlaces);

    return {
        decimalSeparator,
        groupingSeparator: digitGroupingSeparator,
        decimalPlaces: visibleDecimalPlaces,
        format: value => formatDigits(value, prefix)
    };
};
