import { plural } from '@lingui/core/macro';
import { useLingui } from '@lingui/react/macro';

import { MICRO_UNIT_DECIMAL_PLACES } from '../../@generic/constant/micro-unit-decimal-places.constant';

import { useFormatDigits } from './use-format-digits.hook';

export const useFormatFundQuantity = () => {
    const { t } = useLingui();
    const formatQuantity = useFormatDigits(0, MICRO_UNIT_DECIMAL_PLACES);

    return (quantity: number) => {
        const count = formatQuantity(quantity);
        const absoluteQuantity = Math.abs(quantity);

        return t({ message: plural(absoluteQuantity, { one: `${count} certificate`, other: `${count} certificates` }) });
    };
};
