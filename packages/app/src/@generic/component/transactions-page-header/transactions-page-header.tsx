import { Trans, useLingui } from '@lingui/react/macro';
import { View } from 'react-native';

import { TransactionsPageSelector } from '../../../app/(tabs)/transactions-page.selector';
import { useIsAccessibilityTextSize } from '../../hook/use-is-accessibility-text-size.hook';
import { TransactionsTabType } from '../../type/transactions-tab.type';
import { AnimatedTabBar } from '../animated-tab-bar/animated-tab-bar';
import { SegmentedControl } from '../segmented-control/segmented-control';

import type { SegmentedControlSegmentInterface } from '../../interface/segmented-control-segment.interface';
import type { TabConfigInterface } from '../../interface/tab-config.interface';

interface Props {
    readonly activeTab: TransactionsTabType;
    readonly onChangeTab: (tab: TransactionsTabType) => void;
}

const TABS: readonly TabConfigInterface<TransactionsTabType>[] = [
    { key: 'transactions', label: <Trans>Transactions</Trans>, testID: TransactionsPageSelector.TransactionsTab },
    { key: 'recurring', label: <Trans>Recurring</Trans>, testID: TransactionsPageSelector.RecurringTab }
];

export const TransactionsPageHeader = ({ activeTab, onChangeTab }: Props) => {
    const { t } = useLingui();
    const isAccessibilityTextSize = useIsAccessibilityTextSize();
    const segments: readonly SegmentedControlSegmentInterface<TransactionsTabType>[] = [
        { value: 'transactions', label: t`Transactions`, testID: TransactionsPageSelector.TransactionsTab },
        { value: 'recurring', label: t`Recurring`, testID: TransactionsPageSelector.RecurringTab }
    ];

    return (
        <View className="bg-surface border-b-hairline border-surface-separator">
            {isAccessibilityTextSize ? (
                <View className="px-5xl pb-md">
                    <SegmentedControl
                        segments={segments}
                        value={activeTab}
                        onChange={onChangeTab}
                        className="min-h-[48px] bg-primary/45 dark:bg-surface-fill"
                    />
                </View>
            ) : (
                <AnimatedTabBar tabs={TABS} activeTab={activeTab} onChangeTab={onChangeTab} />
            )}
        </View>
    );
};
