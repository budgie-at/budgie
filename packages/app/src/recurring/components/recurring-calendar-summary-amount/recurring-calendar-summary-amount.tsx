import { cva } from 'class-variance-authority';
import { Text, View } from 'react-native';

import { ProtectedText } from '../../../@generic/component/protected-text/protected-text';
import { useIsAccessibilityTextSize } from '../../../@generic/hook/use-is-accessibility-text-size.hook';
import { TRANSACTION_SECONDARY_MAX_FONT_SIZE_MULTIPLIER } from '../../../transaction/constant/transaction-secondary-max-font-size-multiplier.constant';

import type { ReactNode } from 'react';

interface Props {
    readonly formattedAmount: string;
    readonly children: ReactNode;
}

const amountVariants = cva('min-w-0 gap-y-xxs', {
    variants: { isAccessibilityTextSize: { true: 'flex-row flex-wrap items-center justify-between gap-x-md', false: 'flex-1' } }
});

export const RecurringCalendarSummaryAmount = ({ formattedAmount, children }: Props) => {
    const isAccessibilityTextSize = useIsAccessibilityTextSize();

    return (
        <View className={amountVariants({ isAccessibilityTextSize })}>
            <Text
                dynamicTypeRamp="footnote"
                maxFontSizeMultiplier={TRANSACTION_SECONDARY_MAX_FONT_SIZE_MULTIPLIER}
                className="text-[12px] text-secondary-foreground"
            >
                {children}
            </Text>
            <ProtectedText
                dynamicTypeRamp="footnote"
                maxFontSizeMultiplier={TRANSACTION_SECONDARY_MAX_FONT_SIZE_MULTIPLIER}
                className="text-[13px] font-medium text-primary tabular-nums"
            >
                {formattedAmount}
            </ProtectedText>
        </View>
    );
};
