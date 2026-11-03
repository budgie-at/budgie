import { convertFromMicroUnits } from '@budgie/contracts';

import { isPositiveNumber } from '@rnw-community/shared';

import { useFormatDigits } from '../../i18n/hook/use-format-digits.hook';

export const useBudgetProgressLabels = (spent: number, limit: number, currencySymbol: string, decimalPlaces: number) => {
    const formatDigits = useFormatDigits(decimalPlaces);

    return {
        amountLabel: `${formatDigits(convertFromMicroUnits(spent), currencySymbol)} / ${formatDigits(convertFromMicroUnits(limit), currencySymbol)}`,
        percentLabel: `${Math.round((isPositiveNumber(limit) ? spent / limit : 0) * 100)}%`
    };
};
