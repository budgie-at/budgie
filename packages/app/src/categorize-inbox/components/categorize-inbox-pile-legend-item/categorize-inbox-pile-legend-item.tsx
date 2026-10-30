import { Text, View } from 'react-native';

import { cn } from '../../../@generic/utils/cn.util';

interface Props {
    readonly dotClassName: readonly string[];
    readonly text: string;
}

export const CategorizeInboxPileLegendItem = ({ dotClassName, text }: Props) => (
    <View className="w-1/2 flex-row items-center gap-x-sm">
        <View className={cn('h-[8px] w-[8px] rounded-full', dotClassName)} />
        <Text className="text-[13px] text-secondary-foreground tabular-nums" numberOfLines={1}>
            {text}
        </Text>
    </View>
);
