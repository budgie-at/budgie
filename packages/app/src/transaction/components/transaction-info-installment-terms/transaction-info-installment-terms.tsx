import { UserIconNameEnum, convertFromMicroUnits } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';

import { isDefined } from '@rnw-community/shared';

import { useProtectedAmountLabel } from '../../../@generic/hook/use-protected-amount-label.hook';
import { useFormatDate } from '../../../i18n/hook/use-format-date.hook';
import { useInstallmentPlanScheduleQuery } from '../../../installment-plan/query/use-installment-plan-schedule.query';
import { TransactionInfoPageSelector } from '../transaction-info-page/transaction-info-page.selector';
import { TransactionInfoRow } from '../transaction-info-row/transaction-info-row';

import type { AccountWithInstrumentEntityInterface } from '@budgie/contracts';

interface Props {
    readonly account: AccountWithInstrumentEntityInterface;
}

export const TransactionInfoInstallmentTerms = ({ account }: Props) => {
    const { t } = useLingui();
    const formatDigits = useProtectedAmountLabel();
    const { formatMonthAndDay } = useFormatDate();
    const schedule = useInstallmentPlanScheduleQuery(account.id);

    if (!isDefined(schedule)) {
        return null;
    }

    const { paidCount, installmentCount } = schedule;
    const remaining = formatDigits(convertFromMicroUnits(schedule.remainingAmount), account.instrument.symbol);
    const nextDate = isDefined(schedule.nextDueAt) ? formatMonthAndDay(schedule.nextDueAt) : null;
    const nextAmount = formatDigits(convertFromMicroUnits(schedule.nextAmount ?? 0), account.instrument.symbol);

    return (
        <>
            <TransactionInfoRow
                icon={UserIconNameEnum.CalendarClock}
                label={t`Remaining`}
                value={remaining}
                description={t`${paidCount} of ${installmentCount} paid`}
                testID={TransactionInfoPageSelector.Row.DebtProgress}
            />
            {isDefined(schedule.nextAmount) ? (
                <TransactionInfoRow
                    icon={UserIconNameEnum.Calendar}
                    label={t`Next payment`}
                    value={nextAmount}
                    description={nextDate}
                    testID={TransactionInfoPageSelector.Row.NextPayment}
                />
            ) : null}
        </>
    );
};
