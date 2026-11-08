import { Text, View } from 'react-native';

import { getTagMonogram } from '../../utils/get-tag-monogram.util';

interface Props {
    readonly title: string;
}

export const TagMonogram = ({ title }: Props) => (
    <View
        className="size-[36px] items-center justify-center rounded-full bg-surface-disc"
        accessibilityElementsHidden
        importantForAccessibility="no-hide-descendants"
    >
        <Text className="text-secondary-foreground text-[16px] font-semibold" maxFontSizeMultiplier={1.3}>
            {getTagMonogram(title)}
        </Text>
    </View>
);
