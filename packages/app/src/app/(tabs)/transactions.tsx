import { useState } from 'react';
import { View } from 'react-native';
import { Directions, Gesture, GestureDetector } from 'react-native-gesture-handler';
import { runOnJS } from 'react-native-reanimated';

import { TransactionsPageSelectors } from '../../@e2e/selectors/transactions-page.selector';
import { Page } from '../../@generic/component/page/page';
import { TransactionsPageHeader } from '../../@generic/component/transactions-page-header/transactions-page-header';
import { useFocusKey } from '../../@generic/hook/use-focus-key.hook';
import { RecurringCalendarContent } from '../../transaction/components/recurring-calendar-content/recurring-calendar-content';
import { TransactionList } from '../../transaction/components/transaction-list/transaction-list';

import type { TransactionsTabType } from '../../@generic/type/transactions-tab.type';

export default function TransactionsPage() {
    const [activeTab, setActiveTab] = useState<TransactionsTabType>('transactions');
    const focusKey = useFocusKey();

    const handleSwipeLeft = () => void setActiveTab('recurring');
    const handleSwipeRight = () => void setActiveTab('transactions');

    const swipeLeft = Gesture.Fling()
        .direction(Directions.LEFT)
        .onEnd(() => void runOnJS(handleSwipeLeft)());
    const swipeRight = Gesture.Fling()
        .direction(Directions.RIGHT)
        .onEnd(() => void runOnJS(handleSwipeRight)());
    const swipeGesture = Gesture.Race(swipeLeft, swipeRight);

    const header = <TransactionsPageHeader activeTab={activeTab} onChangeTab={setActiveTab} />;

    return (
        <Page testID={TransactionsPageSelectors.Container} header={header}>
            <GestureDetector gesture={swipeGesture}>
                <View className="flex-1">
                    {activeTab === 'transactions' ? <TransactionList focusKey={focusKey} accountId={null} /> : <RecurringCalendarContent />}
                </View>
            </GestureDetector>
        </Page>
    );
}
