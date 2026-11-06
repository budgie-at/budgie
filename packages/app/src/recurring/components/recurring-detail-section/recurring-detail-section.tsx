import { View } from 'react-native';

import { GroupedListSectionTitle } from '../../../@generic/component/grouped-list-section-title/grouped-list-section-title';
import { TransactionInfoGroup } from '../../../transaction/components/transaction-info-group/transaction-info-group';

import type { ReactNode } from 'react';

interface Props {
    readonly title: string;
    readonly children: ReactNode;
}

export const RecurringDetailSection = ({ title, children }: Props) => (
    <View className="gap-y-sm">
        <GroupedListSectionTitle title={title} />
        <TransactionInfoGroup>{children}</TransactionInfoGroup>
    </View>
);
