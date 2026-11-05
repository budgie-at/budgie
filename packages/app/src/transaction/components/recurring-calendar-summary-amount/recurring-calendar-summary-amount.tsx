import { Text, View } from 'react-native';

import { ProtectedText } from '../../../@generic/component/protected-text/protected-text';

import type { ReactNode } from 'react';

interface Props {
    readonly formattedAmount: string;
    readonly children: ReactNode;
}

export const RecurringCalendarSummaryAmount = ({ formattedAmount, children }: Props) => (
    <View className="flex-1 min-w-0 gap-y-xxs">
        <Text dynamicTypeRamp="footnote" className="text-[13px] text-secondary-foreground">
            {children}
        </Text>
        <ProtectedText dynamicTypeRamp="body" className="text-[15px] font-medium text-primary tabular-nums">
            {formattedAmount}
        </ProtectedText>
    </View>
);
