import { AccountDebtTypeEnum } from '@budgie/contracts';
import { Trans, useLingui } from '@lingui/react/macro';
import { Text, View } from 'react-native';

import { isDefined, isPositiveNumber } from '@rnw-community/shared';

import { useProtectedAmountLabel } from '../../../@generic/hook/use-protected-amount-label.hook';
import { InstallmentPlanNextPayment } from '../../../installment-plan/component/installment-plan-next-payment/installment-plan-next-payment';
import { DEBT_REMAINING_LABEL } from '../../constant/debt-remaining-label.constant';
import { DEBT_SETTLED_LABEL } from '../../constant/debt-settled-label.constant';
import { DebtAccountCardDeadline } from '../debt-account-card-deadline/debt-account-card-deadline';
import { DebtAccountCardEmpty } from '../debt-account-card-empty/debt-account-card-empty';
import { DebtAccountCardFrame } from '../debt-account-card-frame/debt-account-card-frame';
import { DebtAccountCardSettled } from '../debt-account-card-settled/debt-account-card-settled';
import { DebtAccountCardSkeleton } from '../debt-account-card-skeleton/debt-account-card-skeleton';
import { DebtAccountCardSummary } from '../debt-account-card-summary/debt-account-card-summary';
import { DebtAccountCardSummarySelector } from '../debt-account-card-summary/debt-account-card-summary.selector';

import type { AccountEntityInterface, DebtAccountProgressSummaryInterface } from '@budgie/contracts';

interface Props {
    readonly account: Pick<AccountEntityInterface, 'id' | 'title' | 'debtType' | 'deadline'>;
    readonly instrumentSymbol: string;
    readonly debtProgressSummary: DebtAccountProgressSummaryInterface | null;
}

export const DebtAccountCard = ({ account, instrumentSymbol, debtProgressSummary }: Props) => {
    const { id, title, debtType, deadline } = account;

    const { t } = useLingui();
    const protectAmount = useProtectedAmountLabel();

    const deadlineBadge = isDefined(deadline) ? <DebtAccountCardDeadline deadline={deadline} /> : null;

    if (!isDefined(debtProgressSummary)) {
        return (
            <DebtAccountCardFrame
                id={id}
                title={title}
                accessibilityLabel={`${title}. ${t`Loading debt progress`}`}
                debtType={debtType}
                percentage={0}
                subtitle={deadlineBadge}
                trailing={<DebtAccountCardSkeleton />}
            />
        );
    }

    const { outstandingAmount, paidAmount, percentage, totalAmount } = debtProgressSummary;
    const displayPercentage = percentage >= 100 ? 100 : Math.floor(percentage);
    const isSettled = !isPositiveNumber(outstandingAmount) && percentage >= 100;
    const statusBadge = isSettled ? <DebtAccountCardSettled debtType={debtType} /> : deadlineBadge;
    const installmentNextPayment =
        debtType === AccountDebtTypeEnum.INSTALLMENT && !isSettled ? (
            <InstallmentPlanNextPayment accountId={id} instrumentSymbol={instrumentSymbol} />
        ) : null;
    const separator = isDefined(statusBadge) ? <Text className="text-xs text-secondary-foreground">·</Text> : null;
    const subtitle = isDefined(installmentNextPayment) ? (
        <View className="flex-row items-center">{installmentNextPayment}</View>
    ) : (
        <View className="flex-row items-center gap-x-xs">
            <Text
                className="shrink-0 text-xs text-secondary-foreground tabular-nums"
                testID={DebtAccountCardSummarySelector.Percentage(title, displayPercentage)}
            >
                <Trans>{displayPercentage}%</Trans>
            </Text>
            {separator}
            {statusBadge}
            {installmentNextPayment}
        </View>
    );
    const trailing = isPositiveNumber(totalAmount) ? (
        <DebtAccountCardSummary
            instrumentSymbol={instrumentSymbol}
            outstandingAmount={outstandingAmount}
            title={title}
            totalAmount={totalAmount}
        />
    ) : (
        <DebtAccountCardEmpty />
    );

    return (
        <DebtAccountCardFrame
            id={id}
            title={title}
            accessibilityLabel={`${title}. ${t(DEBT_REMAINING_LABEL[debtType])}: ${protectAmount(outstandingAmount, instrumentSymbol)}. ${t(DEBT_SETTLED_LABEL[debtType])}: ${protectAmount(paidAmount, instrumentSymbol)}. ${t`Total`}: ${protectAmount(totalAmount, instrumentSymbol)}. ${displayPercentage}%`}
            debtType={debtType}
            percentage={displayPercentage}
            subtitle={subtitle}
            trailing={trailing}
        />
    );
};
