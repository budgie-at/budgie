import { AccountDebtTypeEnum, AccountEntityInterface, AccountTypeEnum } from '@budgie/contracts';
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
import { FOREGROUND_COLOR_PALETTE } from '../../../@generic/constant/foreground-color-palette.constant';
import { cn } from '../../../@generic/utils/cn.util';
import { convertFromMicroUnits } from '../../../@generic/utils/convert-from-micro-units.util';
import { useFormatDate } from '../../../i18n/hook/use-format-date.hook';
import { useFormatDigits } from '../../../i18n/hook/use-format-digits.hook';
import { useFormatMoney } from '../../../i18n/hook/use-format-money.hook';
import { useSettingsContext } from '../../../settings/context/settings.context';
import { useSetting } from '../../../settings/hook/use-setting.hook';
import { ACCOUNT_DEBT_TYPE_COLOR } from '../../constant/account-debt-type-color.constant';
import { useAccountBalanceQuery } from '../../query/use-account-balance.query';
import { getDeadlinePriority } from '../../util/get-deadline-priority.util';

interface Props extends Pick<
    AccountEntityInterface,
    'id' | 'createdAt' | 'title' | 'type' | 'icon' | 'debtType' | 'targetBalance' | 'deadline'
> {
    readonly className?: string;
    readonly instrumentSymbol: string;
}

const textVariant = cva('text-xxs font-semibold text-right border-b border-b-secondary-corner pb-[2px]', {
    variants: { variant: FOREGROUND_COLOR_PALETTE }
});

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

export const AccountCard = (props: Props) => {
    const { id, title, type, icon, debtType, targetBalance, deadline, className, instrumentSymbol, createdAt } = props;

    const showCents = useSetting('showCents');
    const { decimalPlaces, defaultCurrency } = useSettingsContext();
    const formatMoney = useFormatMoney(decimalPlaces, defaultCurrency, false);
    const { formatCompactFullDate } = useFormatDate();

    const { balance } = useAccountBalanceQuery(id);

    const formatDigits = useFormatDigits(showCents ? 0 : decimalPlaces);

    const navigateToAccount = () => void router.push(`/account/${id}/details`);
    const navigateToEditAccount = () => void router.push(`/account/${id}/update`);

    const isDebtAccount = type === AccountTypeEnum.DEBT;

    const circleVariant = isDebtAccount ? ACCOUNT_DEBT_TYPE_COLOR[debtType] : 'ghost';

    const amountLeft = formatMoney(Math.max(targetBalance - balance, 0));
    const accountBalance = `${instrumentSymbol}${formatDigits(convertFromMicroUnits(balance).toString())}`;

    const deadlinePriority = isDefined(deadline) ? getDeadlinePriority(createdAt, deadline) : 'normal';

    const progressStyle: ViewStyle = { width: `${(balance / targetBalance) * 100}%` };

    return (
        <Card onPress={navigateToAccount} className={cn(cardVariants({ deadlinePriority }), className)}>
            <View className="flex-row items-center justify-between">
                <View className="flex-row items-center gap-x-lg">
                    <CircleIcon icon={icon} variant={circleVariant} border={false} />

                    {isDebtAccount && isDefined(deadline) ? (
                        <View className="flex-row items-center gap-x-xs">
                            <Icon icon="Calendar" className="text-secondary-foreground" size={12} />
                            <Text className="text-secondary-foreground text-xxs font-medium">{formatCompactFullDate(deadline)}</Text>
                        </View>
                    ) : null}
                </View>

                <HapticPressable className="rounded-full p-xs active:bg-secondary-background" onPress={navigateToEditAccount}>
                    <Icon className="text-primary" icon="EllipsisVertical" size={14} />
                </HapticPressable>
            </View>

            <View className="gap-1">
                <Text className="text-secondary-foreground" ellipsizeMode="tail" numberOfLines={1}>
                    {title}
                </Text>

                {isDebtAccount ? (
                    <View className="flex-row items-center justify-between">
                        <ProtectedText className="text-primary font-medium">{amountLeft}</ProtectedText>

                        <View>
                            <ProtectedText className={textVariant({ variant: ACCOUNT_DEBT_TYPE_COLOR[debtType] })}>
                                {formatMoney(balance)}
                            </ProtectedText>
                            <ProtectedText className="text-secondary-foreground text-xxs font-medium text-right">
                                {formatMoney(targetBalance)}
                            </ProtectedText>
                        </View>
                    </View>
                ) : (
                    <ProtectedText className="text-primary font-medium">{accountBalance}</ProtectedText>
                )}
            </View>

            {isDebtAccount ? <View className={progressVariants({ debtType })} style={progressStyle} /> : null}
        </Card>
    );
};
