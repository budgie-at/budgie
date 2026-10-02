import { UserIconNameEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { cn } from 'cn';
import { Text, View } from 'react-native';

import { isDefined, isPositiveNumber } from '@rnw-community/shared';

import { Icon } from '../../../@generic/component/icon/icon';
import { useProtectedAmountLabel } from '../../../@generic/hook/use-protected-amount-label.hook';
import { useFormatDate } from '../../../i18n/hook/use-format-date.hook';
import { DEBT_REMAINING_LABEL } from '../../constant/debt-remaining-label.constant';
import { DEBT_SETTLED_LABEL } from '../../constant/debt-settled-label.constant';
import { isDebtDeadlineUrgent } from '../../utils/is-debt-deadline-urgent.util';
import { AccountCardBase } from '../account-card-base/account-card-base';
import { DebtAccountCardEmpty } from '../debt-account-card-empty/debt-account-card-empty';
import { DebtAccountCardRing } from '../debt-account-card-ring/debt-account-card-ring';
import { DebtAccountCardSkeleton } from '../debt-account-card-skeleton/debt-account-card-skeleton';
import { DebtAccountCardSummary } from '../debt-account-card-summary/debt-account-card-summary';

import type { AccountEntityInterface, DebtAccountProgressSummaryInterface } from '@budgie/contracts';

interface Props extends Pick<AccountEntityInterface, 'id' | 'createdAt' | 'title' | 'icon' | 'debtType' | 'deadline'> {
    readonly balance: number;
    readonly className?: string;
    readonly debtProgressSummary: DebtAccountProgressSummaryInterface | null;
    readonly instrumentSymbol: string;
}

export const DebtAccountCard = (props: Props) => {
    const { id, createdAt, title, icon, balance, debtType, deadline, className, debtProgressSummary, instrumentSymbol } = props;

    const { t } = useLingui();
    const { formatCompactFullDate } = useFormatDate();
    const protectAmount = useProtectedAmountLabel();

    if (!isDefined(debtProgressSummary)) {
        return (
            <AccountCardBase
                id={id}
                title={title}
                icon={icon}
                balance={balance}
                instrumentSymbol={instrumentSymbol}
                accessibilityLabel={`${title}. ${t`Loading debt progress`}`}
                leading={<DebtAccountCardRing debtType={debtType} icon={icon} percentage={null} title={title} />}
                balanceContent={<DebtAccountCardSkeleton />}
                className={className}
            />
        );
    }

    const { outstandingAmount, paidAmount, percentage, totalAmount } = debtProgressSummary;
    const isSettled = !isPositiveNumber(outstandingAmount) && percentage >= 100;
    const displayPercentage = percentage >= 100 ? 100 : Math.floor(percentage);
    const hasDebt = isPositiveNumber(totalAmount);
    const balanceContent = hasDebt ? (
        <DebtAccountCardSummary
            instrumentSymbol={instrumentSymbol}
            outstandingAmount={outstandingAmount}
            title={title}
            totalAmount={totalAmount}
        />
    ) : (
        <DebtAccountCardEmpty />
    );
    const isUrgent = isDefined(deadline) && isDebtDeadlineUrgent(createdAt, deadline);
    const deadlineBackgroundClassName = isUrgent ? 'bg-dark-warning-background' : 'bg-ghost-background';
    const deadlineTextClassName = isUrgent ? 'text-dark-warning-foreground' : 'text-secondary-foreground';

    return (
        <AccountCardBase
            id={id}
            title={title}
            icon={icon}
            balance={balance}
            instrumentSymbol={instrumentSymbol}
            accessibilityLabel={`${title}. ${t(DEBT_REMAINING_LABEL[debtType])}: ${protectAmount(outstandingAmount, instrumentSymbol)}. ${t(DEBT_SETTLED_LABEL[debtType])}: ${protectAmount(paidAmount, instrumentSymbol)}. ${t`Total`}: ${protectAmount(totalAmount, instrumentSymbol)}. ${displayPercentage}%`}
            leading={<DebtAccountCardRing debtType={debtType} icon={icon} percentage={displayPercentage} title={title} />}
            balanceContent={balanceContent}
            className={className}
        >
            {isDefined(deadline) && !isSettled && (
                <View className={cn('flex-row items-center gap-x-xs self-start rounded-full px-md py-xs', deadlineBackgroundClassName)}>
                    <Icon icon={UserIconNameEnum.Calendar} className={deadlineTextClassName} size={11} />
                    <Text className={cn('text-xxs font-medium', deadlineTextClassName)}>{formatCompactFullDate(deadline)}</Text>
                </View>
            )}
        </AccountCardBase>
    );
};
