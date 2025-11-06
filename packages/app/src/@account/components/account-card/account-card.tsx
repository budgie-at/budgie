import { ImpactFeedbackStyle } from 'expo-haptics/src/Haptics.types';
import { router } from 'expo-router';
import { Text, View } from 'react-native';

import { Card } from '../../../@generic/components/card/card';
import { CircleIcon } from '../../../@generic/components/circle-icon/circle-icon';
import { ICONS } from '../../../@generic/constant/icons.constant';
import { useVibration } from '../../../@generic/hooks/use-vibration.hook';
import { cn } from '../../../@generic/utils/cn.util';
import { formatMoney } from '../../../@generic/utils/format-money.util';

import type { IconName } from '../../../@generic/constant/icons.constant';
import type { AccountEntityInterface } from '@budgie/contracts';

interface Props extends Pick<AccountEntityInterface, 'title' | 'balance' | 'currency' | 'id'> {
    readonly className?: string;
    readonly icon: IconName;
}

export const AccountCard = ({ icon, title, balance, currency, className, id }: Props) => {
    const [, hapticImpact] = useVibration();

    const navigateToAccount = () => {
        void router.push(`/account/${id}`);
        hapticImpact(ImpactFeedbackStyle.Light);
    };

    return (
        <Card onPress={navigateToAccount} className={cn('gap-3', className)}>
            <CircleIcon border={false} icon={ICONS[icon]} variant="ghost" />

            <View className="gap-1">
                <Text className="text-secondary-foreground" ellipsizeMode="tail" numberOfLines={1}>
                    {title}
                </Text>
                <Text className="text-primary">{formatMoney(balance, currency)}</Text>
            </View>
        </Card>
    );
};
