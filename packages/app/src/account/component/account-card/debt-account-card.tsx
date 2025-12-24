import { AccountDebtTypeEnum, AccountEntityInterface } from '@budgie/contracts';
import { cva } from 'class-variance-authority';
import { router } from 'expo-router';
import { Text, View } from 'react-native';

import { isDefined } from '@rnw-community/shared';

import { Card } from '../../../@generic/component/card/card';
import { CircleIcon } from '../../../@generic/component/circle-icon/circle-icon';
import { HapticPressable } from '../../../@generic/component/haptic-pressable/haptic-pressable';
import { Icon } from '../../../@generic/component/icon/icon';
import { ICONS } from '../../../@generic/constant/icons.constant';
import { cn } from '../../../@generic/utils/cn.util';
import { convertFromMicroUnits } from '../../../@generic/utils/convert-from-micro-units.util';
import { useFormatDate } from '../../../i18n/hook/use-format-date.hook';
import { useFormatMoney } from '../../../i18n/hook/use-format-money.hook';
import { useSettingsContext } from '../../../settings/context/settings.context';
import { useAccountBalanceQuery } from '../../query/use-account-balance.query';
import * as Contacts from 'expo-contacts';
import { useEffect } from 'react';
import { ContactAccessButton } from 'expo-contacts';


interface Props extends Pick<AccountEntityInterface, 'id' | 'title' | 'debtType' | 'amountToReturn' | 'returnAt'> {
    readonly className?: string;
    readonly instrumentSymbol: string;
}

const textVariant = cva('text-xxs font-semibold text-right border-b border-b-secondary-corner pb-[2px]', {
    variants: {
        variant: {
            [AccountDebtTypeEnum.LENT]: 'text-positive-foreground',
            [AccountDebtTypeEnum.BORROW]: 'text-warning-foreground'
        }
    }
});

export const DebtAccountCard = ({ title, className, debtType, id, instrumentSymbol, returnAt, amountToReturn }: Props) => {
    const { decimalPlaces, defaultCurrency } = useSettingsContext();
    const format = useFormatMoney(decimalPlaces, defaultCurrency, false);
    const { balance } = useAccountBalanceQuery(id);
    const { formatCompactFullDate } = useFormatDate();

    const navigateToAccount = () => void router.push(`/account/${id}/details`);
    const navigateToEditAccount = () => void router.push(`/account/${id}/update`);

    const formattedBalance = format(amountToReturn - balance);
    const icon = debtType === AccountDebtTypeEnum.LENT ? 'TrendingUp' : 'TrendingDown';
    const variant = debtType === AccountDebtTypeEnum.LENT ? 'positive' : 'warning';

    // useEffect(() => {
    //     (async () => {
    //         const { status } = await Contacts.requestPermissionsAsync();
    //         if (status === 'granted') {
    //             const { data } = await Contacts.getContactsAsync({
    //                 fields: [Contacts.Fields.Emails, Contacts.Fields.FirstName, Contacts.Fields.LastName]
    //             });
    //
    //             console.log(JSON.stringify({ data }, null, 4));
    //         }
    //     })();
    // }, []);

    return (
        <Card onPress={navigateToAccount} className={cn('gap-3 active:scale-xs', className)}>

            <View className="flex-row items-center gap-x-lg">
                <CircleIcon icon={ICONS[icon]} variant={variant} />

                {isDefined(returnAt) ? (
                    <View className="flex-row items-center gap-x-xs">
                        <Icon icon={ICONS.Calendar} className="text-secondary-foreground" size={12} />
                        <Text className="text-secondary-foreground text-xxs font-medium">{formatCompactFullDate(returnAt)}</Text>
                    </View>
                ) : null}

                <HapticPressable className="rounded-full p-xs active:bg-secondary-background ml-auto" onPress={navigateToEditAccount}>
                    <Icon className="text-primary" icon={ICONS.EllipsisVertical} size={14} />
                </HapticPressable>
            </View>

            <View className="gap-1">
                <Text className="text-secondary-foreground" ellipsizeMode="tail" numberOfLines={1}>
                    {title}
                </Text>

                <View className="flex-row items-center justify-between">
                    <Text className="text-primary font-medium">{formattedBalance}</Text>

                    <View>
                        <Text className={textVariant({ variant: debtType })}>{format(convertFromMicroUnits(balance))}</Text>
                        <Text className="text-secondary-foreground text-xxs font-mediumsemibold text-right">{format(amountToReturn)}</Text>
                    </View>
                </View>
            </View>
        </Card>
    );
};
