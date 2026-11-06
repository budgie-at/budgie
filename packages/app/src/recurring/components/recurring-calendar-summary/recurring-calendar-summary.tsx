import { Trans } from '@lingui/react/macro';
import { cva } from 'class-variance-authority';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

import { LoadingContent } from '../../../@generic/component/loading-content/loading-content';
import { ProtectedText } from '../../../@generic/component/protected-text/protected-text';
import { useIsAccessibilityTextSize } from '../../../@generic/hook/use-is-accessibility-text-size.hook';
import { RecurringCalendarSummaryAmount } from '../recurring-calendar-summary-amount/recurring-calendar-summary-amount';

interface Props {
    readonly title: string;
    readonly isLoading: boolean;
    readonly formattedTotal: string;
    readonly formattedExpected: string;
    readonly formattedRecorded: string;
}

const continuousCorners = { borderCurve: 'continuous' as const };

const breakdownVariants = cva('', { variants: { isAccessibilityTextSize: { true: 'gap-y-md', false: 'flex-row' } } });

export const RecurringCalendarSummary = ({ title, isLoading, formattedTotal, formattedExpected, formattedRecorded }: Props) => {
    const isAccessibilityTextSize = useIsAccessibilityTextSize();

    return (
        <View className="rounded-3xl bg-grouped-surface-row px-xl py-xl" style={continuousCorners}>
            <LoadingContent
                isLoading={isLoading}
                loadingIndicator={<ActivityIndicator size="small" colorClassName="accent-primary" style={StyleSheet.absoluteFill} />}
                className={breakdownVariants({ isAccessibilityTextSize })}
            >
                <View className="flex-[1.3] items-center gap-y-xxs">
                    <ProtectedText className="text-[22px] font-bold text-primary tabular-nums" numberOfLines={1} adjustsFontSizeToFit>
                        {formattedTotal}
                    </ProtectedText>
                    <Text className="text-[13px] font-medium text-secondary-foreground">{title}</Text>
                </View>
                <RecurringCalendarSummaryAmount formattedAmount={formattedExpected}>
                    <Trans>Still to pay</Trans>
                </RecurringCalendarSummaryAmount>
                <RecurringCalendarSummaryAmount formattedAmount={formattedRecorded}>
                    <Trans>Paid</Trans>
                </RecurringCalendarSummaryAmount>
            </LoadingContent>
        </View>
    );
};
