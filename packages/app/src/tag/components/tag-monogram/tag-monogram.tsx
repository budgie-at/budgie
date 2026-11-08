import { cva } from 'class-variance-authority';
import { Text, View } from 'react-native';

import { TagMonogramSizeEnum } from '../../enum/tag-monogram-size.enum';
import { getTagMonogram } from '../../utils/get-tag-monogram.util';

interface Props {
    readonly title: string;
    readonly size?: TagMonogramSizeEnum;
}

const discVariants = cva('items-center justify-center rounded-full bg-surface-disc', {
    variants: { size: { [TagMonogramSizeEnum.MEDIUM]: 'size-[36px]', [TagMonogramSizeEnum.LARGE]: 'size-[88px]' } }
});

const letterVariants = cva('text-secondary-foreground font-semibold', {
    variants: { size: { [TagMonogramSizeEnum.MEDIUM]: 'text-[16px]', [TagMonogramSizeEnum.LARGE]: 'text-[38px]' } }
});

export const TagMonogram = ({ title, size = TagMonogramSizeEnum.MEDIUM }: Props) => (
    <View className={discVariants({ size })} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
        <Text className={letterVariants({ size })} maxFontSizeMultiplier={1.3}>
            {getTagMonogram(title)}
        </Text>
    </View>
);
