import { Text, View } from 'react-native';

import type { ReactNode } from 'react';

interface Props {
    readonly title: string;
    readonly subtitle: string;
    readonly trailing?: ReactNode;
}

export const CategorizeInboxClusterCardHeader = ({ title, subtitle, trailing }: Props) => (
    <View className="flex-row items-start justify-between gap-x-lg">
        <View className="flex-1 gap-y-xs">
            <Text className="text-primary font-medium text-md" numberOfLines={1}>
                {title}
            </Text>
            <Text className="text-secondary-foreground text-xs">{subtitle}</Text>
        </View>

        {trailing}
    </View>
);
