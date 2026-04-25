import { Trans } from '@lingui/react/macro';

import { TransactionsPageSelector } from '../../../app/(tabs)/transactions-page.selector';
import { TransactionsTabType } from '../../type/transactions-tab.type';
import { AnimatedTabBar } from '../animated-tab-bar/animated-tab-bar';

interface Props {
    readonly activeTab: TransactionsTabType;
    readonly onChangeTab: (tab: TransactionsTabType) => void;
}

export const TransactionsPageHeader = ({ activeTab, onChangeTab }: Props) => {
    const tabs = [
        { key: 'transactions', label: <Trans>Transactions</Trans>, testID: TransactionsPageSelector.TransactionsTab },
        { key: 'recurring', label: <Trans>Recurring</Trans>, testID: TransactionsPageSelector.RecurringTab }
    ] as const;

    return <AnimatedTabBar tabs={tabs} activeTab={activeTab} onChangeTab={onChangeTab} />;
};
