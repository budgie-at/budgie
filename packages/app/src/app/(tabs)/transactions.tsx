import { useState } from 'react';

import { Page } from '../../@generic/component/page/page';
import { TransactionsPageHeader } from '../../@generic/component/transactions-page-header/transactions-page-header';
import { TransactionsPageContent } from '../../transaction/components/transactions-page-content/transactions-page-content';

import { TransactionsPageSelector } from './transactions-page.selector';

import type { TransactionsTabType } from '../../@generic/type/transactions-tab.type';

const TABS: readonly TransactionsTabType[] = ['transactions', 'recurring'];

export default function TransactionsPage() {
    const [activeTab, setActiveTab] = useState<TransactionsTabType>('transactions');

    const header = <TransactionsPageHeader activeTab={activeTab} onChangeTab={setActiveTab} />;

    return (
        <Page testID={TransactionsPageSelector.Container} header={header}>
            <TransactionsPageContent activeTab={activeTab} tabs={TABS} onChangeTab={setActiveTab} />
        </Page>
    );
}
