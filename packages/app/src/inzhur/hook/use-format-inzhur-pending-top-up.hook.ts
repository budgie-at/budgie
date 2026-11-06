import { useLingui } from '@lingui/react/macro';

import { PROTECTED_AMOUNT_PLACEHOLDER } from '../../@generic/constant/protected-amount-placeholder.constant';
import { useIsAmountProtected } from '../../@generic/hook/use-is-amount-protected.hook';
import { useDisplayFormatDigits } from '../../i18n/hook/use-display-format-digits.hook';
import { useFormatDate } from '../../i18n/hook/use-format-date.hook';
import { useHryvniaInstrumentQuery } from '../query/use-hryvnia-instrument.query';

import type { InzhurPendingTopUpInterface } from '@budgie/sync';

export const useFormatInzhurPendingTopUp = () => {
    const { t } = useLingui();
    const formatDigits = useDisplayFormatDigits();
    const { formatMonthAndDayAndOptionalYear } = useFormatDate();
    const hryvnia = useHryvniaInstrumentQuery();
    const isAmountProtected = useIsAmountProtected();

    return (topUp: Pick<InzhurPendingTopUpInterface, 'amount' | 'operatedAt'>) => {
        const amount = isAmountProtected ? PROTECTED_AMOUNT_PLACEHOLDER : formatDigits(topUp.amount, hryvnia?.symbol ?? '');
        const date = formatMonthAndDayAndOptionalYear(topUp.operatedAt);

        return t`${amount} topped up ${date} — what did you buy?`;
    };
};
