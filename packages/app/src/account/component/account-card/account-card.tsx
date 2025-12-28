import { AccountEntityInterface } from '@budgie/contracts';
import { router } from 'expo-router';
import { Text, View } from 'react-native';

import { Card } from '../../../@generic/components/card/card';
import { CircleIcon } from '../../../@generic/components/circle-icon/circle-icon';
import { HapticPressable } from '../../../@generic/components/haptic-pressable/haptic-pressable';
import { Icon } from '../../../@generic/components/icon/icon';
import { ProtectedText } from '../../../@generic/components/protected-text/protected-text';
import { ICONS } from '../../../@generic/constant/icons.constant';
import { cn } from '../../../@generic/utils/cn.util';
import { convertFromMicroUnits } from '../../../@generic/utils/convert-from-micro-units.util';
import { useFormatDigits } from '../../../i18n/hook/use-format-digits.hook';
import { useSettingsContext } from '../../../settings/context/settings.context';
import { useSetting } from '../../../settings/hook/use-setting.hook';
import { useAccountBalanceQuery } from '../../query/use-account-balance.query';

interface Props extends Pick<AccountEntityInterface, 'id' | 'title' | 'icon'> {
    readonly className?: string;
    readonly instrumentSymbol: string;
}

export const AccountCard = ({ icon, title, className, id, instrumentSymbol }: Props) => {
    const showCents = useSetting('showCents');
    const { decimalPlaces } = useSettingsContext();
    const { balance } = useAccountBalanceQuery(id);

    const format = useFormatDigits(showCents ? 0 : decimalPlaces);

    const navigateToAccount = () => void router.push(`/account/${id}/details`);
    const navigateToEditAccount = () => void router.push(`/account/${id}/update`);

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

                <ProtectedText className="text-primary font-medium" placeholderText={`${instrumentSymbol}999.99`}>
                    {instrumentSymbol}
                    {formattedBalance}
                </ProtectedText>
            </View>
        </Card>
    );
};
