import { Text, View } from 'react-native';

import { cn } from '../../../@generic/utils/cn.util';

interface Props {
    readonly value: string;
    readonly label: string;
    readonly className?: string;
}

export const CategorizeInboxGroupStat = ({ value, label, className }: Props) => (
    <View className={cn('flex-1 gap-y-xxs', className)}>
        <Text className="text-primary text-md font-semibold tabular-nums" numberOfLines={1}>
            {value}
        </Text>
        <Text className="text-secondary-foreground text-xs">{label}</Text>
    </View>
);
