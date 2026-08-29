import { AccountDebtTypeEnum, UserIconNameEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { Text, View } from 'react-native';

import { isDefined, isPositiveNumber } from '@rnw-community/shared';

import { Icon } from '../../../@generic/component/icon/icon';
import { useFormatDate } from '../../../i18n/hook/use-format-date.hook';
import { ACCOUNT_COLOR } from '../../constant/account-color.constant';
import { buildDebtAccountProgressSummary } from '../../utils/build-debt-account-progress-summary.util';
import { AccountCardBase } from '../account-card-base/account-card-base';
import { DebtAccountCardFooter } from '../debt-account-card-footer/debt-account-card-footer';
import { DebtAccountCardSummary } from '../debt-account-card-summary/debt-account-card-summary';

import type { DebtAccountProgressSummaryInterface } from '../../interface/debt-account-progress-summary.interface';
import type { AccountEntityInterface } from '@budgie/contracts';

interface Props extends Pick<AccountEntityInterface, 'id' | 'createdAt' | 'title' | 'icon' | 'debtType' | 'targetBalance' | 'deadline'> {
    readonly balance: number;
    readonly className?: string;
    readonly debtProgressSummary?: DebtAccountProgressSummaryInterface;
    readonly instrumentSymbol: string;
}

const getDeadlinePriority = (createdAt: Date, deadline: Date): 'high' | 'normal' => {
    const totalMs = deadline.getTime() - createdAt.getTime();
    const remainingMs = deadline.getTime() - Date.now();

    if (!isPositiveNumber(totalMs)) {
        return 'normal';
    }

    return remainingMs <= totalMs * 0.3 ? 'high' : 'normal';
};

export const DebtAccountCard = (props: Props) => {
    const { id, createdAt, title, icon, balance, debtType, targetBalance, deadline, className, debtProgressSummary, instrumentSymbol } =
        props;

    const { t } = useLingui();
    const { formatCompactFullDate } = useFormatDate();

    const isBorrowed = debtType === AccountDebtTypeEnum.BORROW;
    const summary: DebtAccountProgressSummaryInterface = debtProgressSummary ?? {
        ...buildDebtAccountProgressSummary({
            balance: 0,
            closedAmount: 0,
            debtType,
            openedExtraAmount: 0,
            openedPrincipalAmount: 0,
            targetAmount: targetBalance
        }),
        creditAmount: 0,
        debitAmount: 0
    };
    const deadlinePriority = isDefined(deadline) ? getDeadlinePriority(createdAt, deadline) : 'normal';

    const labels = {
        directionIcon: isBorrowed ? UserIconNameEnum.ArrowDownLeft : UserIconNameEnum.ArrowUpRight,
        directionLabel: isBorrowed ? t`Left to repay` : t`Left to receive`
    };

    const topRight = isDefined(deadline) ? (
        <View className="flex-row items-center gap-x-xs">
            <Icon icon={UserIconNameEnum.Calendar} className="text-secondary-foreground" size={12} />
            <Text className="text-secondary-foreground text-xxs font-medium">{formatCompactFullDate(deadline)}</Text>
        </View>
    ) : null;

    const balanceContent = (
        <DebtAccountCardSummary
            instrumentSymbol={instrumentSymbol}
            outstandingAmount={summary.outstandingAmount}
            paidAmount={summary.paidAmount}
            title={title}
            totalAmount={summary.totalAmount}
        />
    );

    return (
        <AccountCardBase
            id={id}
            title={title}
            icon={icon}
            balance={balance}
            instrumentSymbol={instrumentSymbol}
            circleVariant={ACCOUNT_COLOR.DEBT}
            deadlinePriority={deadlinePriority}
            topRight={topRight}
            balanceContent={balanceContent}
            className={className}
        >
            <DebtAccountCardFooter
                directionIcon={labels.directionIcon}
                directionLabel={labels.directionLabel}
                percentage={summary.percentage}
            />
        </AccountCardBase>
    );
};
