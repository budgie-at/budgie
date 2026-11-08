import { Text, View } from 'react-native';

import { getTagMonogram } from '../../utils/get-tag-monogram.util';

interface Props {
    readonly title: string;
}

export const TagFormHeroIcon = ({ title }: Props) => (
    <View
        className="h-[88px] w-[88px] items-center justify-center rounded-full bg-surface-disc"
        accessibilityElementsHidden
        importantForAccessibility="no-hide-descendants"
    >
        <Text className="text-secondary-foreground text-[38px] font-semibold" maxFontSizeMultiplier={1.3}>
            {getTagMonogram(title)}
        </Text>
    </View>
);
