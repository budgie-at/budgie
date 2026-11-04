import { Trans } from '@lingui/react/macro';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

import { LoadingContent } from '../../../@generic/component/loading-content/loading-content';
import { ProtectedText } from '../../../@generic/component/protected-text/protected-text';

interface Props {
    readonly isLoading: boolean;
    readonly formattedTotal: string;
}

const continuousCorners = { borderCurve: 'continuous' as const };

export const RecurringCalendarSummary = ({ isLoading, formattedTotal }: Props) => (
    <View
        className="min-h-11 flex-row flex-wrap items-center justify-between gap-x-xl gap-y-xxs rounded-3xl bg-grouped-surface-row px-3xl py-lg mb-md"
        style={continuousCorners}
    >
        <Text dynamicTypeRamp="body" className="shrink text-[16px] text-primary">
            <Trans>Monthly total</Trans>
        </Text>
        <LoadingContent
            isLoading={isLoading}
            loadingIndicator={<ActivityIndicator size="small" colorClassName="accent-primary" style={StyleSheet.absoluteFill} />}
        >
            <ProtectedText dynamicTypeRamp="headline" className="text-[16px] font-semibold text-primary tabular-nums">
                {formattedTotal}
            </ProtectedText>
        </LoadingContent>
    </View>
);
