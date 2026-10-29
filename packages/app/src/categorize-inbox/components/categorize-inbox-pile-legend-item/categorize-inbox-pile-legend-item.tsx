import { Text, View } from 'react-native';

import { CategorizeInboxDot } from '../categorize-inbox-dot/categorize-inbox-dot';

interface Props {
    readonly dotClassName: string;
    readonly text: string;
}

export const CategorizeInboxPileLegendItem = ({ dotClassName, text }: Props) => (
    <View className="flex-row items-center gap-x-xs">
        <CategorizeInboxDot className={dotClassName} />
        <Text className="text-xs text-secondary-foreground tabular-nums" numberOfLines={1}>
            {text}
        </Text>
    </View>
);
