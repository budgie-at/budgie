import { Text, View } from 'react-native';

import { isNotEmptyString } from '@rnw-community/shared';

import { TransactionInfoGroup } from '../../../transaction/components/transaction-info-group/transaction-info-group';

import type { ReactNode } from 'react';

interface Props {
    readonly title: string;
    readonly children: ReactNode;
    readonly footer?: string;
}

export const RecurringDetailSection = ({ title, children, footer }: Props) => (
    <View className="gap-y-sm">
        <Text accessibilityRole="header" className="px-3xl text-[13px] font-medium text-secondary-foreground">
            {title}
        </Text>
        <TransactionInfoGroup>{children}</TransactionInfoGroup>
        {isNotEmptyString(footer) ? <Text className="px-3xl pt-xs text-[13px] text-secondary-foreground">{footer}</Text> : null}
    </View>
);
