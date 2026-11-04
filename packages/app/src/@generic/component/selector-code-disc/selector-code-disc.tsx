import { cva } from 'class-variance-authority';
import { Text, View } from 'react-native';

interface Props {
    readonly code: string;
    readonly isSelected: boolean;
}

const COMPACT_CODE_LENGTH = 3;

const discVariants = cva('h-[36px] w-[36px] items-center justify-center rounded-full', {
    variants: { isSelected: { true: 'bg-positive-action', false: 'bg-surface-disc' } }
});

const codeVariants = cva('font-semibold tabular-nums', {
    variants: {
        isSelected: { true: 'text-positive-action-foreground', false: 'text-primary' },
        isCompact: { true: 'text-[11px]', false: 'text-[13px] tracking-[0.3px]' }
    }
});

export const SelectorCodeDisc = ({ code, isSelected }: Props) => (
    <View className={discVariants({ isSelected })} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
        <Text className={codeVariants({ isSelected, isCompact: code.length > COMPACT_CODE_LENGTH })} numberOfLines={1}>
            {code}
        </Text>
    </View>
);
