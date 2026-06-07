import { Activity } from 'react';
import { View } from 'react-native';
import { GestureDetector } from 'react-native-gesture-handler';

import { tabSwipeGesture } from '../../../@generic/utils/tab-swipe-gesture.util';
import { RecurringCalendarContent } from '../recurring-calendar-content/recurring-calendar-content';
import { TransactionList } from '../transaction-list/transaction-list';

import type { TransactionsTabType } from '../../../@generic/type/transactions-tab.type';

interface Props {
    readonly activeTab: TransactionsTabType;
    readonly tabs: readonly TransactionsTabType[];
    readonly onChangeTab: (tab: TransactionsTabType) => void;
}

export const TransactionsPageContent = ({ activeTab, tabs, onChangeTab }: Props) => {
    const swipeGesture = tabSwipeGesture({ tabs, activeTab, onChangeTab });

    const isTransactionsTab = activeTab === 'transactions';
    const transactionsActivityMode = isTransactionsTab ? 'visible' : 'hidden';
    const recurringActivityMode = isTransactionsTab ? 'hidden' : 'visible';

    return (
        <GestureDetector gesture={swipeGesture}>
            <View className="flex-1">
                <Activity mode={transactionsActivityMode}>
                    <TransactionList accountId={null} />
                </Activity>

                <Activity mode={recurringActivityMode}>
                    <RecurringCalendarContent />
                </Activity>
            </View>
        </GestureDetector>
    );
};
