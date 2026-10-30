import { Text, View } from 'react-native';

import { cn } from '../../../@generic/utils/cn.util';

interface Props {
    readonly dotClassName: string;
    readonly text: string;
}

export const CategorizeInboxHeroCount = ({ dotClassName, text }: Props) => (
    <View className="flex-row items-center gap-x-xs">
        <View className={cn('h-[6px] w-[6px] rounded-full', dotClassName)} />
        <Text className="text-[13px] text-secondary-foreground tabular-nums" numberOfLines={1}>
            {text}
        </Text>
    </View>
);
