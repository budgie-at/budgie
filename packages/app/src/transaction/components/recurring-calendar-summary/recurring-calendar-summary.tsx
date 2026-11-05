import { Trans } from '@lingui/react/macro';
import { cva } from 'class-variance-authority';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

import { LoadingContent } from '../../../@generic/component/loading-content/loading-content';
import { ProtectedText } from '../../../@generic/component/protected-text/protected-text';
import { useIsAccessibilityTextSize } from '../../../@generic/hook/use-is-accessibility-text-size.hook';
import { TRANSACTION_SECONDARY_MAX_FONT_SIZE_MULTIPLIER } from '../../constant/transaction-secondary-max-font-size-multiplier.constant';
import { RecurringCalendarSummaryAmount } from '../recurring-calendar-summary-amount/recurring-calendar-summary-amount';

interface Props {
    readonly isLoading: boolean;
    readonly formattedTotal: string;
    readonly formattedExpected: string;
    readonly formattedRecorded: string;
}

const totalVariants = cva('gap-y-xs', {
    variants: { isAccessibilityTextSize: { true: '', false: 'flex-row flex-wrap items-center justify-between gap-x-xl' } }
});
const breakdownVariants = cva('gap-y-md', { variants: { isAccessibilityTextSize: { true: '', false: 'flex-row gap-x-3xl' } } });

const continuousCorners = { borderCurve: 'continuous' as const };

export const RecurringCalendarSummary = ({ isLoading, formattedTotal, formattedExpected, formattedRecorded }: Props) => {
    const isAccessibilityTextSize = useIsAccessibilityTextSize();

    return (
        <View className="gap-y-md rounded-3xl bg-grouped-surface-row p-3xl" style={continuousCorners}>
            <View className={totalVariants({ isAccessibilityTextSize })}>
                <Text
                    dynamicTypeRamp="footnote"
                    maxFontSizeMultiplier={TRANSACTION_SECONDARY_MAX_FONT_SIZE_MULTIPLIER}
                    className="text-[13px] text-secondary-foreground"
                >
                    <Trans>Monthly total</Trans>
                </Text>
                <LoadingContent
                    isLoading={isLoading}
                    loadingIndicator={<ActivityIndicator size="small" colorClassName="accent-primary" style={StyleSheet.absoluteFill} />}
                >
                    <ProtectedText dynamicTypeRamp="headline" className="text-[17px] font-semibold text-primary tabular-nums">
                        {formattedTotal}
                    </ProtectedText>
                </LoadingContent>
            </View>
            <LoadingContent isLoading={isLoading} loadingIndicator={null} className={breakdownVariants({ isAccessibilityTextSize })}>
                <RecurringCalendarSummaryAmount formattedAmount={formattedExpected}>
                    <Trans>Expected</Trans>
                </RecurringCalendarSummaryAmount>
                <RecurringCalendarSummaryAmount formattedAmount={formattedRecorded}>
                    <Trans>Recorded</Trans>
                </RecurringCalendarSummaryAmount>
            </LoadingContent>
        </View>
    );
};
