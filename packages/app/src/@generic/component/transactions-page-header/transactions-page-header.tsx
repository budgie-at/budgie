import { Trans, useLingui } from '@lingui/react/macro';
import { use } from 'react';
import { View } from 'react-native';
import { useResolveClassNames } from 'uniwind';

import { ScreenChromeHeader } from '@rnw-community/react-native-screen-chrome';

import { TransactionsPageSelector } from '../../../app/(tabs)/transactions-page.selector';
import { ScreenChromeStickyHeadersContext } from '../../context/screen-chrome-sticky-headers.context';
import { useIsAccessibilityTextSize } from '../../hook/use-is-accessibility-text-size.hook';
import { TransactionsTabType } from '../../type/transactions-tab.type';
import { SegmentedControl } from '../segmented-control/segmented-control';
import { TransactionsPageTab } from '../transactions-page-tab/transactions-page-tab';

import type { SegmentedControlSegmentInterface } from '../../interface/segmented-control-segment.interface';
import type { TabConfigInterface } from '../../interface/tab-config.interface';
import type { LayoutChangeEvent } from 'react-native';

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
    const stickyContext = use(ScreenChromeStickyHeadersContext);
    const isAccessibilityTextSize = useIsAccessibilityTextSize();
    const rowStyle = useResolveClassNames('px-0');
    const handleHeaderLayout = (event: LayoutChangeEvent) => stickyContext?.headerBottom.set(event.nativeEvent.layout.height);
    const segments: readonly SegmentedControlSegmentInterface<TransactionsTabType>[] = [
        { value: 'transactions', label: t`Transactions`, testID: TransactionsPageSelector.TransactionsTab },
        { value: 'recurring', label: t`Recurring`, testID: TransactionsPageSelector.RecurringTab }
    ];

    return (
        <ScreenChromeHeader inFlow rowStyle={rowStyle} onLayout={handleHeaderLayout}>
            {isAccessibilityTextSize ? (
                <View className="flex-1 px-5xl pb-md">
                    <SegmentedControl
                        segments={segments}
                        maxFontSizeMultiplier={2}
                        value={activeTab}
                        onChange={onChangeTab}
                        className="min-h-[48px]"
                    />
                </View>
            ) : (
                <View className="flex-1 px-5xl pb-md">
                    <View className="flex-row items-center gap-x-xl">
                        {TABS.map(tab => (
                            <TransactionsPageTab key={tab.key} tab={tab} activeTab={activeTab} onChangeTab={onChangeTab} />
                        ))}
                    </View>
                </View>
            )}
        </ScreenChromeHeader>
    );
};
