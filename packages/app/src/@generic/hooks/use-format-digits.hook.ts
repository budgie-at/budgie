import { isNotEmptyString } from '@rnw-community/shared';

import { useI18nContext } from '../../i18n/context/i18n.context';

export const useFormatDigits = (decimalPlaces: number) => {
    const { intl } = useI18nContext();

    const format = (rawNumeric: string) => {
        if (!isNotEmptyString(rawNumeric)) {
            return '';
        }

        const num = Number.parseFloat(rawNumeric);

        if (Number.isNaN(num)) {
            return '';
        }

        return intl.formatNumber(num, {
            style: 'decimal',
            minimumFractionDigits: decimalPlaces,
            maximumFractionDigits: decimalPlaces
        });
    };

    return { format };
};
