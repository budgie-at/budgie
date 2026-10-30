import { cva } from 'class-variance-authority';
import { Text, View } from 'react-native';

import { CategorizeInboxTonalCapsuleVariantEnum } from '../../enum/categorize-inbox-tonal-capsule-variant.enum';

interface Props {
    readonly label: string;
    readonly variant: CategorizeInboxTonalCapsuleVariantEnum;
}

const continuousCorners = { borderCurve: 'continuous' as const };

const surfaceVariants = cva('h-[32px] items-center justify-center rounded-full px-2xl', {
    variants: {
        variant: {
            [CategorizeInboxTonalCapsuleVariantEnum.POSITIVE]: 'bg-positive-tonal',
            [CategorizeInboxTonalCapsuleVariantEnum.WARNING]: 'bg-warning-fill/15',
            [CategorizeInboxTonalCapsuleVariantEnum.NEUTRAL]: 'bg-surface-fill'
        }
    }
});

const labelVariants = cva('text-[15px] font-semibold', {
    variants: {
        variant: {
            [CategorizeInboxTonalCapsuleVariantEnum.POSITIVE]: 'text-positive-action',
            [CategorizeInboxTonalCapsuleVariantEnum.WARNING]: 'text-attention-foreground',
            [CategorizeInboxTonalCapsuleVariantEnum.NEUTRAL]: 'text-primary'
        }
    }
});

export const CategorizeInboxTonalCapsule = ({ label, variant }: Props) => (
    <View className={surfaceVariants({ variant })} style={continuousCorners}>
        <Text className={labelVariants({ variant })} numberOfLines={1}>
            {label}
        </Text>
    </View>
);
