import { useState } from 'react';
import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ScreenChromeFrame } from '@rnw-community/react-native-screen-chrome';

import { GroupedSurface } from '../../@generic/component/grouped-surface/grouped-surface';
import { TransactionsPageHeader } from '../../@generic/component/transactions-page-header/transactions-page-header';
import { FLOATING_TAB_BAR_HEIGHT, FLOATING_TAB_BAR_MARGIN } from '../../@generic/constant/floating-tab-bar.constant';
import { SCREEN_CHROME_CONFIG } from '../../@generic/constant/screen-chrome-config.constant';
import { ScreenChromeThemeProvider } from '../../@generic/provider/screen-chrome-theme.provider';
import { TransactionsPageContent } from '../../transaction/components/transactions-page-content/transactions-page-content';

import { TransactionsPageSelector } from './transactions-page.selector';

import type { TransactionsTabType } from '../../@generic/type/transactions-tab.type';

const TRANSACTIONS_CHROME_CONFIG = { ...SCREEN_CHROME_CONFIG, headerHeight: 44 };

const TABS: readonly TransactionsTabType[] = ['transactions', 'recurring'];

export default function TransactionsPage() {
    const { bottom } = useSafeAreaInsets();
    const tabBarScrimStyle = { height: bottom + FLOATING_TAB_BAR_HEIGHT + FLOATING_TAB_BAR_MARGIN };
    const [activeTab, setActiveTab] = useState<TransactionsTabType>('transactions');

    return (
        <GroupedSurface testID={TransactionsPageSelector.Container}>
            <ScreenChromeThemeProvider config={TRANSACTIONS_CHROME_CONFIG}>
                <ScreenChromeFrame>
                    <TransactionsPageHeader activeTab={activeTab} onChangeTab={setActiveTab} />

                    <View className="flex-1 px-5xl">
                        <TransactionsPageContent activeTab={activeTab} tabs={TABS} onChangeTab={setActiveTab} />
                    </View>
                    <View pointerEvents="none" className="absolute inset-x-0 bottom-0">
                        <View className="h-[32px] bg-linear-to-b from-surface/0 to-surface" />
                        <View className="bg-surface" style={tabBarScrimStyle} />
                    </View>
                </ScreenChromeFrame>
            </ScreenChromeThemeProvider>
        </GroupedSurface>
    );
}
