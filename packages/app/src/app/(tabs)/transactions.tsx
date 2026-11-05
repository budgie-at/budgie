import { useState } from 'react';
import { View } from 'react-native';

import { ScreenChromeFrame } from '@rnw-community/react-native-screen-chrome';

import { GroupedSurface } from '../../@generic/component/grouped-surface/grouped-surface';
import { TransactionsPageHeader } from '../../@generic/component/transactions-page-header/transactions-page-header';
import { SCREEN_CHROME_CONFIG } from '../../@generic/constant/screen-chrome-config.constant';
import { ScreenChromeThemeProvider } from '../../@generic/provider/screen-chrome-theme.provider';
import { TransactionsPageContent } from '../../transaction/components/transactions-page-content/transactions-page-content';

import { TransactionsPageSelector } from './transactions-page.selector';

import type { TransactionsTabType } from '../../@generic/type/transactions-tab.type';

const TRANSACTIONS_CHROME_CONFIG = { ...SCREEN_CHROME_CONFIG, headerHeight: 44, collapsedHeaderHeight: 32 };

const TABS: readonly TransactionsTabType[] = ['transactions', 'recurring'];

export default function TransactionsPage() {
    const [activeTab, setActiveTab] = useState<TransactionsTabType>('transactions');

    return (
        <GroupedSurface testID={TransactionsPageSelector.Container}>
            <ScreenChromeThemeProvider config={TRANSACTIONS_CHROME_CONFIG}>
                <ScreenChromeFrame>
                    <TransactionsPageHeader activeTab={activeTab} onChangeTab={setActiveTab} />

                    <View className="flex-1 px-5xl">
                        <TransactionsPageContent activeTab={activeTab} tabs={TABS} onChangeTab={setActiveTab} />
                    </View>
                </ScreenChromeFrame>
            </ScreenChromeThemeProvider>
        </GroupedSurface>
    );
}
