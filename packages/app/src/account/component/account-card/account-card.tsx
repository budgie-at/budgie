import { AccountEntityInterface } from '@budgie/contracts';
import { router } from 'expo-router';
import { Text, View } from 'react-native';

import { Card } from '../../../@generic/components/card/card';
import { CircleIcon } from '../../../@generic/components/circle-icon/circle-icon';
import { HapticPressable } from '../../../@generic/components/haptic-pressable/haptic-pressable';
import { Icon } from '../../../@generic/components/icon/icon';
import { ICONS } from '../../../@generic/constant/icons.constant';
import { useFormatDigits } from '../../../@generic/hooks/use-format-digits.hook';
import { cn } from '../../../@generic/utils/cn.util';
import { convertFromMicroUnits } from '../../../@generic/utils/convert-from-micro-units.util';
import { useSettingsContext } from '../../../settings/context/settings.context';
import { useAccountBalanceQuery } from '../../query/use-account-balance.query';

interface Props extends Pick<AccountEntityInterface, 'id' | 'title' | 'icon'> {
    readonly className?: string;
    readonly instrumentSymbol: string;
}

export const AccountCard = ({ icon, title, className, id, instrumentSymbol }: Props) => {
    const { decimalPlaces } = useSettingsContext();
    const format = useFormatDigits(decimalPlaces);
    const { balance } = useAccountBalanceQuery(id);

    const navigateToAccount = () => void router.push(`/account/${id}`);
    const navigateToEditAccount = () => void router.push(`/edit-account/${id}`);

    const formattedBalance = format(convertFromMicroUnits(balance).toString());

    return (
        <Card onPress={navigateToAccount} className={cn('gap-3 active:scale-xs', className)}>
            <View className="flex-row justify-between">
                <CircleIcon border={false} icon={ICONS[icon]} variant="ghost" />

                <HapticPressable className="rounded-full p-xs active:bg-secondary-background" onPress={navigateToEditAccount}>
                    <Icon className="text-primary" icon={ICONS.EllipsisVertical} size={14} />
                </HapticPressable>
            </View>

            <View className="gap-1">
                <Text className="text-secondary-foreground" ellipsizeMode="tail" numberOfLines={1}>
                    {title}
                </Text>

                <Text className="text-primary">
                    {instrumentSymbol}
                    {formattedBalance}
                </Text>
            </View>
        </Card>
    );
};
