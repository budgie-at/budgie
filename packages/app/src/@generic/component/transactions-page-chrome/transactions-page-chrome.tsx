import { View } from 'react-native';

import { EdgeFade, ScreenChromeFrame } from '@rnw-community/react-native-screen-chrome';

import { SCREEN_CHROME_CONFIG } from '../../constant/screen-chrome-config.constant';
import { ScreenChromeThemeProvider } from '../../provider/screen-chrome-theme.provider';
import { TransactionsPageHeader } from '../transactions-page-header/transactions-page-header';

import type { TransactionsTabType } from '../../type/transactions-tab.type';
import type { ReactNode } from 'react';

interface Props {
    readonly activeTab: TransactionsTabType;
    readonly onChangeTab: (tab: TransactionsTabType) => void;
    readonly children: ReactNode;
}

const TRANSACTIONS_CHROME_CONFIG = { ...SCREEN_CHROME_CONFIG, headerHeight: 44, collapsedHeaderHeight: 32 };
const SCROLL_ANIMATION = { opacityInputRange: [0, 24] } as const;

export const TransactionsPageChrome = ({ activeTab, onChangeTab, children }: Props) => (
    <ScreenChromeThemeProvider config={TRANSACTIONS_CHROME_CONFIG}>
        <ScreenChromeFrame>
            <TransactionsPageHeader activeTab={activeTab} onChangeTab={onChangeTab} />
            <View className="flex-1 px-5xl">{children}</View>
            <EdgeFade position="top" scrollAnimation={SCROLL_ANIMATION} />
        </ScreenChromeFrame>
    </ScreenChromeThemeProvider>
);
