import { AccountDebtTypeEnum, UserIconNameEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { Text, View } from 'react-native';

import { isDefined, isPositiveNumber } from '@rnw-community/shared';

import { Icon } from '../../../@generic/component/icon/icon';
import { useFormatDate } from '../../../i18n/hook/use-format-date.hook';
import { ACCOUNT_COLOR } from '../../constant/account-color.constant';
import { buildDebtAccountProgressSummary } from '../../utils/build-debt-account-progress-summary.util';
import { AccountCardBase } from '../account-card-base/account-card-base';
import { DebtAccountCardSummary } from '../debt-account-card-summary/debt-account-card-summary';
import { DebtProgressTrack } from '../debt-progress-track/debt-progress-track';

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

    const fallbackSummary = buildDebtAccountProgressSummary({
        balance: 0,
        closedAmount: 0,
        debtType,
        openedExtraAmount: 0,
        openedPrincipalAmount: 0,
        targetAmount: targetBalance
    });
    const summary: DebtAccountProgressSummaryInterface = debtProgressSummary ?? {
        closedAmount: fallbackSummary.closedAmount,
        creditAmount: 0,
        debitAmount: 0,
        openedAmount: fallbackSummary.openedAmount,
        outstandingAmount: fallbackSummary.outstandingAmount,
        paidAmount: fallbackSummary.paidAmount,
        percentage: fallbackSummary.percentage,
        totalAmount: fallbackSummary.totalAmount
    };
    const deadlinePriority = isDefined(deadline) ? getDeadlinePriority(createdAt, deadline) : 'normal';

    const directionLabel = debtType === AccountDebtTypeEnum.BORROW ? t`Left to repay` : t`Left to receive`;
    const directionIcon = debtType === AccountDebtTypeEnum.BORROW ? UserIconNameEnum.ArrowDownLeft : UserIconNameEnum.ArrowUpRight;

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
            <View className="gap-y-sm">
                <View className="flex-row items-center justify-between">
                    <View className="flex-row flex-1 items-center gap-x-xxs min-w-0">
                        <Icon icon={directionIcon} size={10} className="text-secondary-foreground" />
                        <Text className="text-secondary-foreground text-xxs" numberOfLines={1}>
                            {directionLabel}
                        </Text>
                    </View>

                    <Text className="text-xxs font-semibold text-primary">{summary.percentage}%</Text>
                </View>

                <DebtProgressTrack percentage={summary.percentage} className="h-1.5" />
            </View>
        </AccountCardBase>
    );
};
