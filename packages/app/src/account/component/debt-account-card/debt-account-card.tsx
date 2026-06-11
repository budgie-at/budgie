import { AccountDebtTypeEnum, AccountEntityInterface, UserIconNameEnum } from '@budgie/contracts';
import { cva } from 'class-variance-authority';
import { Text, View } from 'react-native';
import { ViewStyle } from 'react-native/Libraries/StyleSheet/StyleSheetTypes';

import { isDefined, isPositiveNumber } from '@rnw-community/shared';

import { Icon } from '../../../@generic/component/icon/icon';
import { useFormatDate } from '../../../i18n/hook/use-format-date.hook';
import { ACCOUNT_DEBT_TYPE_COLOR } from '../../constant/account-debt-type-color.constant';
import { getDeadlinePriority } from '../../util/get-deadline-priority.util';
import { AccountCardBase } from '../account-card-base/account-card-base';
import { DebtAccountCardSummary } from '../debt-account-card-summary/debt-account-card-summary';

interface Props extends Pick<AccountEntityInterface, 'id' | 'createdAt' | 'title' | 'icon' | 'debtType' | 'targetBalance' | 'deadline'> {
    readonly balance: number;
    readonly className?: string;
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

const getDisplayBalance = (debtType: AccountDebtTypeEnum, balance: number) =>
    debtType === AccountDebtTypeEnum.BORROW ? Math.abs(balance) : balance;

export const DebtAccountCard = (props: Props) => {
    const { id, createdAt, title, icon, balance, debtType, targetBalance, deadline, className, instrumentSymbol } = props;

    const { formatCompactFullDate } = useFormatDate();

    const displayBalance = getDisplayBalance(debtType, balance);
    const circleVariant = ACCOUNT_DEBT_TYPE_COLOR[debtType];
    const deadlinePriority = isDefined(deadline) ? getDeadlinePriority(createdAt, deadline) : 'normal';
    const progressWidth = isPositiveNumber(targetBalance) ? Math.min((displayBalance / targetBalance) * 100, 100) : 0;
    const progressStyle: ViewStyle = { width: `${progressWidth}%` };

    const topRight = isDefined(deadline) ? (
        <View className="flex-row items-center gap-x-xs">
            <Icon icon={UserIconNameEnum.Calendar} className="text-secondary-foreground" size={12} />
            <Text className="text-secondary-foreground text-xxs font-medium">{formatCompactFullDate(deadline)}</Text>
        </View>
    ) : null;

    const balanceContent = (
        <DebtAccountCardSummary
            debtType={debtType}
            currentBalance={displayBalance}
            targetBalance={targetBalance}
            instrumentSymbol={instrumentSymbol}
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
