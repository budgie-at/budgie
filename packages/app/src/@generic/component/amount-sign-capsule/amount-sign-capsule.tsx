import { AmountSignToggle } from '@budgie/amount-input';
import { useLingui } from '@lingui/react/macro';
import { cva } from 'class-variance-authority';
import { Text, View } from 'react-native';

import { useSignTogglePress } from '../../hook/use-sign-toggle-press.hook';
import { cn } from '../../utils/cn.util';
import { SignToggleGlyph } from '../sign-toggle-glyph/sign-toggle-glyph';

interface Props {
    readonly isNegative: boolean;
    readonly isZero: boolean;
    readonly onToggle: () => void;
}

const CAPSULE_HIT_SLOP = { top: 6, bottom: 6, left: 8, right: 8 };

const capsuleVariants = cva('h-[32px] self-start justify-center rounded-full px-xl active:opacity-70', {
    variants: {
        tone: {
            neutral: 'bg-surface-fill',
            positive: 'bg-positive-tonal',
            negative: 'bg-destructive-background'
        }
    }
});

export const AmountSignCapsule = ({ isNegative, isZero, onToggle }: Props) => {
    const { t } = useLingui();
    const handlePress = useSignTogglePress(onToggle);

    const positiveTextClassName = isZero ? 'text-primary' : 'text-positive-action';
    const positiveTitle = isZero ? t`Positive` : t`In credit`;
    const positiveTone = isZero ? 'neutral' : 'positive';
    const tone = isNegative ? 'negative' : positiveTone;
    const hint = isZero ? <Text className="text-secondary-foreground text-[13px]">{t`Tap to change sign`}</Text> : null;
    const positiveLabel = (
        <View className="flex-row items-center gap-x-xs">
            <Text className={cn('text-[15px] font-semibold', positiveTextClassName)}>{positiveTitle}</Text>
            <SignToggleGlyph className={positiveTextClassName} />
        </View>
    );
    const negativeLabel = (
        <View className="flex-row items-center gap-x-xs">
            <Text className="text-destructive-foreground text-[15px] font-semibold">{t`Overdrawn`}</Text>
            <SignToggleGlyph className="text-destructive-foreground" />
        </View>
    );

    return (
        <View className="flex-row items-center gap-x-md pb-md">
            <AmountSignToggle
                isNegative={isNegative}
                positiveIcon={positiveLabel}
                negativeIcon={negativeLabel}
                className={capsuleVariants({ tone })}
                hitSlop={CAPSULE_HIT_SLOP}
                accessibilityLabel={t`Balance sign`}
                onPress={handlePress}
            />
            {hint}
        </View>
    );
};
