import { useState } from 'react';

import { GroupedSurface } from '../../@generic/component/grouped-surface/grouped-surface';
import { TransactionsPageContent } from '../../transaction/components/transactions-page-content/transactions-page-content';

import { TransactionsPageSelector } from './transactions-page.selector';

import type { TransactionsTabType } from '../../@generic/type/transactions-tab.type';

const TABS: readonly TransactionsTabType[] = ['transactions', 'recurring'];

export default function TransactionsPage() {
    const [activeTab, setActiveTab] = useState<TransactionsTabType>('transactions');

    return (
        <GroupedSurface testID={TransactionsPageSelector.Container}>
            <TransactionsPageContent activeTab={activeTab} tabs={TABS} onChangeTab={setActiveTab} />
        </GroupedSurface>
    );
}
