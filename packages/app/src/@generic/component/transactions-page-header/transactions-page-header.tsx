import { Trans } from '@lingui/react/macro';

import { TransactionsPageSelector } from '../../../app/(tabs)/transactions-page.selector';
import { TransactionsTabType } from '../../type/transactions-tab.type';
import { AnimatedTabBar } from '../animated-tab-bar/animated-tab-bar';

import type { TabConfigInterface } from '../../interface/tab-config.interface';

interface Props {
    readonly activeTab: TransactionsTabType;
    readonly onChangeTab: (tab: TransactionsTabType) => void;
}

const TABS: readonly TabConfigInterface<TransactionsTabType>[] = [
    { key: 'transactions', label: <Trans>Transactions</Trans>, testID: TransactionsPageSelector.TransactionsTab },
    { key: 'recurring', label: <Trans>Recurring</Trans>, testID: TransactionsPageSelector.RecurringTab }
];

export const TransactionsPageHeader = ({ activeTab, onChangeTab }: Props) => (
    <AnimatedTabBar tabs={TABS} activeTab={activeTab} onChangeTab={onChangeTab} />
);
