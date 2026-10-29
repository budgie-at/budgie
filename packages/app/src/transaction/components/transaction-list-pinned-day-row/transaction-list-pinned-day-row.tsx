import { View } from 'react-native';

import { isDefined } from '@rnw-community/shared';

import { TransactionSectionHeader } from '../transaction-section-header/transaction-section-header';

import type { TransactionsByDaySectionInterface } from '../../interface/transactions-by-day-section.interface';

interface Props {
    readonly section: TransactionsByDaySectionInterface | null;
}

export const TransactionListPinnedDayRow = ({ section }: Props) => (
    <View className="h-[32px] px-5xl">
        {isDefined(section) ? <TransactionSectionHeader title={section.title} netAmount={section.netAmount} /> : null}
    </View>
);
