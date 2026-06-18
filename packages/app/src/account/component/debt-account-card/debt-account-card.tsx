import { AccountDebtTypeEnum, UserIconNameEnum } from '@budgie/contracts';
import { cva } from 'class-variance-authority';
import { Text, View } from 'react-native';
import { ViewStyle } from 'react-native/Libraries/StyleSheet/StyleSheetTypes';

import { isDefined } from '@rnw-community/shared';

import { Icon } from '../../../@generic/component/icon/icon';
import { useFormatDate } from '../../../i18n/hook/use-format-date.hook';
import { ACCOUNT_DEBT_TYPE_COLOR } from '../../constant/account-debt-type-color.constant';
import { getDeadlinePriority } from '../../util/get-deadline-priority.util';
import { buildDebtAccountProgressSummary } from '../../utils/build-debt-account-progress-summary.util';
import { AccountCardBase } from '../account-card-base/account-card-base';
import { DebtAccountCardSummary } from '../debt-account-card-summary/debt-account-card-summary';

import type { DebtAccountProgressSummaryInterface } from '../../interface/debt-account-progress-summary.interface';
import type { AccountEntityInterface } from '@budgie/contracts';

interface Props extends Pick<AccountEntityInterface, 'id' | 'createdAt' | 'title' | 'icon' | 'debtType' | 'targetBalance' | 'deadline'> {
    readonly balance: number;
    readonly className?: string;
    readonly debtProgressSummary?: DebtAccountProgressSummaryInterface;
    readonly instrumentSymbol: string;
}

const progressVariants = cva('absolute bottom-0 left-0 h-1', {
    variants: {
        debtType: {
            [AccountDebtTypeEnum.LENT]: 'bg-positive-foreground',
            [AccountDebtTypeEnum.BORROW]: 'bg-warning-foreground'
        }
    }
});

export const DebtAccountCard = (props: Props) => {
    const { id, createdAt, title, icon, balance, debtType, targetBalance, deadline, className, debtProgressSummary, instrumentSymbol } =
        props;

    const { formatCompactFullDate } = useFormatDate();

    const fallbackSummary = buildDebtAccountProgressSummary({
        balance,
        creditAmount: 0,
        debitAmount: 0,
        debtType,
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
    const circleVariant = ACCOUNT_DEBT_TYPE_COLOR[debtType];
    const deadlinePriority = isDefined(deadline) ? getDeadlinePriority(createdAt, deadline) : 'normal';
    const progressStyle: ViewStyle = { width: `${summary.percentage}%` };

    const topRight = isDefined(deadline) ? (
        <View className="flex-row items-center gap-x-xs">
            <Icon icon={UserIconNameEnum.Calendar} className="text-secondary-foreground" size={12} />
            <Text className="text-secondary-foreground text-xxs font-medium">{formatCompactFullDate(deadline)}</Text>
        </View>
    ) : null;

    const balanceContent = (
        <DebtAccountCardSummary
            debtType={debtType}
            instrumentSymbol={instrumentSymbol}
            outstandingAmount={summary.outstandingAmount}
            percentage={summary.percentage}
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
            circleVariant={circleVariant}
            deadlinePriority={deadlinePriority}
            topRight={topRight}
            balanceContent={balanceContent}
            className={className}
        >
            <View className={progressVariants({ debtType })} style={progressStyle} />
        </AccountCardBase>
    );
};
