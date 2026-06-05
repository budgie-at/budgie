import { UserIconNameEnum } from '@budgie/contracts';
import { Text, View } from 'react-native';

import { Icon } from '../../../@generic/component/icon/icon';
import { cn } from '../../../@generic/utils/cn.util';

interface Props {
    readonly icon: UserIconNameEnum;
    readonly label: string;
    readonly value: string;
    readonly className?: string;
    readonly valueClassName?: string;
}

export const MarketDataMetricCard = ({ icon, label, value, className, valueClassName }: Props) => (
    <View className={cn('border-secondary-corner bg-secondary-background rounded-4xl border p-3xl gap-y-md', className)}>
        <View className="flex-row items-center gap-x-sm">
            <Icon icon={icon} size={14} className="text-secondary-foreground" />
            <Text className="text-secondary-foreground text-xs uppercase">{label}</Text>
        </View>

        <Text selectable className={cn('text-primary text-lg font-semibold', valueClassName)} numberOfLines={1}>
            {value}
        </Text>
    </View>
);
