import { Text, View } from 'react-native';

import { Card } from '../../../@generic/components/card/card';
import { CircleIcon } from '../../../@generic/components/circle-icon/circle-icon';
import { ICONS } from '../../../@generic/constant/icons.constant';
import { cn } from '../../../@generic/utils/cn.util';
import { formatMoney } from '../../../@generic/utils/format-money.util';

import type { IconName } from '../../../@generic/constant/icons.constant';
import type { CurrencyEnum } from '@budgie/contracts';

interface Props {
    readonly currency: CurrencyEnum;
    readonly className?: string;
    readonly balance: number;
    readonly icon: IconName;
    readonly title: string;
}

export const AccountCard = ({ icon, title, balance, currency, className }: Props) => (
    <Card className={cn('gap-3', className)}>
        <CircleIcon border={false} icon={ICONS[icon]} variant="ghost" />

        <View className="gap-1">
            <Text className="text-secondary-foreground" ellipsizeMode="tail" numberOfLines={1}>
                {title}
            </Text>
            <Text className="text-primary">{formatMoney(balance, currency)}</Text>
        </View>
    </Card>
);
