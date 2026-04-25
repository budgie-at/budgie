import { useState } from 'react';
import { View } from 'react-native';
import { GestureDetector } from 'react-native-gesture-handler';

import { Page } from '../../@generic/component/page/page';
import { TransactionsPageHeader } from '../../@generic/component/transactions-page-header/transactions-page-header';
import { tabSwipeGesture } from '../../@generic/utils/tab-swipe-gesture.util';
import { RecurringCalendarContent } from '../../transaction/components/recurring-calendar-content/recurring-calendar-content';
import { TransactionList } from '../../transaction/components/transaction-list/transaction-list';

import { TransactionsPageSelector } from './transactions-page.selector';

import type { TransactionsTabType } from '../../@generic/type/transactions-tab.type';

const TABS: readonly TransactionsTabType[] = ['transactions', 'recurring'];

export default function TransactionsPage() {
    const [activeTab, setActiveTab] = useState<TransactionsTabType>('transactions');

    const swipeGesture = tabSwipeGesture({ tabs: TABS, activeTab, onChangeTab: setActiveTab });

    const header = <TransactionsPageHeader activeTab={activeTab} onChangeTab={setActiveTab} />;

    return (
        <Page testID={TransactionsPageSelector.Container} header={header}>
            <GestureDetector gesture={swipeGesture}>
                <View className="flex-1">
                    {activeTab === 'transactions' ? <TransactionList accountId={null} /> : <RecurringCalendarContent />}
                </View>
            </GestureDetector>
        </Page>
    );
}
