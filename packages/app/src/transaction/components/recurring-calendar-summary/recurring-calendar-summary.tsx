import { Trans } from '@lingui/react/macro';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

import { LoadingContent } from '../../../@generic/component/loading-content/loading-content';
import { ProtectedText } from '../../../@generic/component/protected-text/protected-text';
import { RecurringCalendarSummaryAmount } from '../recurring-calendar-summary-amount/recurring-calendar-summary-amount';

interface Props {
    readonly isLoading: boolean;
    readonly formattedTotal: string;
    readonly formattedExpected: string;
    readonly formattedRecorded: string;
}

const continuousCorners = { borderCurve: 'continuous' as const };

export const RecurringCalendarSummary = ({ isLoading, formattedTotal, formattedExpected, formattedRecorded }: Props) => (
    <View className="gap-y-xl rounded-3xl bg-grouped-surface-row p-3xl" style={continuousCorners}>
        <View className="flex-row flex-wrap items-center justify-between gap-x-xl gap-y-xs">
            <Text dynamicTypeRamp="body" className="shrink text-[16px] text-primary">
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
        <LoadingContent isLoading={isLoading} loadingIndicator={null} className="flex-row gap-x-3xl">
            <RecurringCalendarSummaryAmount formattedAmount={formattedExpected}>
                <Trans>Expected</Trans>
            </RecurringCalendarSummaryAmount>
            <RecurringCalendarSummaryAmount formattedAmount={formattedRecorded}>
                <Trans>Recorded</Trans>
            </RecurringCalendarSummaryAmount>
        </LoadingContent>
    </View>
);
