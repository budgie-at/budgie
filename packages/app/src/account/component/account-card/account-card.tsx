import { AccountDebtTypeEnum, AccountEntityInterface, AccountTypeEnum, BankSyncStatusEnum } from '@budgie/contracts';
import { cva } from 'class-variance-authority';
import { router } from 'expo-router';
import { Text, View } from 'react-native';
import { ViewStyle } from 'react-native/Libraries/StyleSheet/StyleSheetTypes';

import { isDefined } from '@rnw-community/shared';

import { Card } from '../../../@generic/component/card/card';
import { CircleIcon } from '../../../@generic/component/circle-icon/circle-icon';
import { HapticPressable } from '../../../@generic/component/haptic-pressable/haptic-pressable';
import { Icon } from '../../../@generic/component/icon/icon';
import { ProtectedText } from '../../../@generic/component/protected-text/protected-text';
import { cn } from '../../../@generic/utils/cn.util';
import { useFormatDate } from '../../../i18n/hook/use-format-date.hook';
import { useFormatDigits } from '../../../i18n/hook/use-format-digits.hook';
import { useSettingsContext } from '../../../settings/context/settings.context';
import { useSetting } from '../../../settings/hook/use-setting.hook';
import { useAccountBankSync } from '../../../sync/hook/use-account-bank-sync.hook';
import { ACCOUNT_DEBT_TYPE_COLOR } from '../../constant/account-debt-type-color.constant';
import { useAccountBalanceQuery } from '../../query/use-account-balance.query';
import { getDeadlinePriority } from '../../util/get-deadline-priority.util';
import { DebtAccountCardSummary } from '../debt-account-card-summary/debt-account-card-summary';

interface Props extends Pick<
    AccountEntityInterface,
    'id' | 'createdAt' | 'title' | 'type' | 'icon' | 'debtType' | 'targetBalance' | 'deadline'
> {
    readonly className?: string;
    readonly instrumentSymbol: string;
}

const cardVariants = cva('relative gap-3 active:scale-xs overflow-hidden', {
    variants: {
        deadlinePriority: {
            high: 'border-dark-warning-corner',
            normal: 'border-secondary-corner'
        }
    }
});

const progressVariants = cva('absolute bottom-0 left-0 h-1', {
    variants: {
        debtType: {
            [AccountDebtTypeEnum.LENT]: 'bg-positive-foreground',
            [AccountDebtTypeEnum.BORROW]: 'bg-warning-foreground'
        }
    }
});

const syncStatusVariants = cva('absolute bottom-3 right-3 size-2 rounded-full', {
    variants: {
        status: {
            [BankSyncStatusEnum.SYNCING]: 'bg-amber-500 animate-pulse',
            [BankSyncStatusEnum.IDLE]: 'bg-green-500',
            [BankSyncStatusEnum.FAILED]: 'bg-destructive'
        }
    }
});

export const AccountCard = (props: Props) => {
    const { id, title, type, icon, debtType, targetBalance, deadline, className, instrumentSymbol, createdAt } = props;

    const showCents = useSetting('showCents');
    const { decimalPlaces } = useSettingsContext();
    const formatDigits = useFormatDigits(showCents ? 0 : decimalPlaces);

    const { formatCompactFullDate } = useFormatDate();

    const { balance } = useAccountBalanceQuery(id);
    const { bankSync } = useAccountBankSync(id);

    const navigateToAccount = () => void router.push(`/account/${id}/details`);
    const navigateToEditAccount = () => void router.push(`/account/${id}/update`);

    const isDebtAccount = type === AccountTypeEnum.DEBT;
    const isBankSyncAccount = type === AccountTypeEnum.BANK_SYNC;

    const circleVariant = isDebtAccount ? ACCOUNT_DEBT_TYPE_COLOR[debtType] : 'ghost';

    const accountBalance = formatDigits(balance, instrumentSymbol);

    const deadlinePriority = isDefined(deadline) ? getDeadlinePriority(createdAt, deadline) : 'normal';

    const progressStyle: ViewStyle = { width: `${(balance / targetBalance) * 100}%` };

    return (
        <Card onPress={navigateToAccount} className={cn(cardVariants({ deadlinePriority }), className)}>
            <View className="flex-row items-center justify-between">
                <View className="flex-row items-center gap-x-lg">
                    <CircleIcon size={36} iconSize={20} icon={icon} variant={circleVariant} border={false} />

                    {isDebtAccount && isDefined(deadline) ? (
                        <View className="flex-row items-center gap-x-xs">
                            <Icon icon="Calendar" className="text-secondary-foreground" size={12} />
                            <Text className="text-secondary-foreground text-xxs font-medium">{formatCompactFullDate(deadline)}</Text>
                        </View>
                    ) : null}
                </View>

                <HapticPressable className="rounded-full active:bg-secondary-background" onPress={navigateToEditAccount}>
                    <Icon className="text-primary" icon="EllipsisVertical" size={14} />
                </HapticPressable>
            </View>

            <View className="gap-1">
                <Text className="text-secondary-foreground" ellipsizeMode="tail" numberOfLines={1}>
                    {title}
                </Text>

                {isDebtAccount ? (
                    <DebtAccountCardSummary
                        debtType={debtType}
                        currentBalance={balance}
                        targetBalance={targetBalance}
                        instrumentSymbol={instrumentSymbol}
                    />
                ) : (
                    <ProtectedText className="text-primary font-medium">{accountBalance}</ProtectedText>
                )}
            </View>

            {isDebtAccount ? <View className={progressVariants({ debtType })} style={progressStyle} /> : null}

            {isBankSyncAccount && isDefined(bankSync) ? <View className={syncStatusVariants({ status: bankSync.status })} /> : null}
        </Card>
    );
};
