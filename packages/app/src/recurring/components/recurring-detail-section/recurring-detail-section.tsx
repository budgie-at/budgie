import { Text, View } from 'react-native';

import { TransactionInfoGroup } from '../../../transaction/components/transaction-info-group/transaction-info-group';

import type { ReactNode } from 'react';

interface Props {
    readonly title: string;
    readonly children: ReactNode;
}

export const RecurringDetailSection = ({ title, children }: Props) => (
    <View className="gap-y-sm">
        <Text accessibilityRole="header" className="px-3xl text-[13px] font-medium text-secondary-foreground">
            {title}
        </Text>
        <TransactionInfoGroup>{children}</TransactionInfoGroup>
    </View>
);
