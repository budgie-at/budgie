import { useAtomValue } from '@effect/atom-react/Hooks';
import { useLingui } from '@lingui/react/macro';
import { parseISO } from 'date-fns/parseISO';

import { isDefined } from '@rnw-community/shared';

import { useProtectedAmountLabel } from '../../@generic/hook/use-protected-amount-label.hook';
import { useFormatDate } from '../../i18n/hook/use-format-date.hook';
import { defaultInstrumentAtom } from '../../settings/constants/settings-atoms.constant';

import type { YieldPositionSummaryInterface } from '@budgie/market';

export const useYieldDepositSubtitle = ({
    accruing,
    interestRate,
    deadline
}: Pick<YieldPositionSummaryInterface, 'accruing' | 'interestRate' | 'deadline'>): string => {
    const { t } = useLingui();
    const formatAmount = useProtectedAmountLabel();
    const { formatDayAndMonthAndYear } = useFormatDate();
    const { symbol } = useAtomValue(defaultInstrumentAtom);

    const accruingAmount = formatAmount(accruing ?? 0, symbol);
    const maturity = isDefined(deadline) ? formatDayAndMonthAndYear(parseISO(deadline)) : '';
    const rate = String(interestRate ?? 0);

    if (isDefined(accruing)) {
        return isDefined(deadline) ? t`Accruing ${accruingAmount} · pays ${maturity}` : t`Accruing ${accruingAmount}`;
    }

    return isDefined(deadline) ? t`${rate}% · matures ${maturity}` : t`${rate}% a year`;
};
