import { BottomChromeInsetProvider } from '@rnw-community/react-native-screen-chrome';

import { ScreenChromeThemeProvider } from '../../../@generic/provider/screen-chrome-theme.provider';
import { CategorizeInboxPageContent } from '../categorize-inbox-page-content/categorize-inbox-page-content';

import type { AnalyticsTransactionsRouteParamsInterface } from '../../../transaction/interface/analytics-transactions-route-params.interface';
import type { CategorizeInboxStrategyInterface } from '../../interface/categorize-inbox-strategy.interface';

interface Props {
    readonly params: AnalyticsTransactionsRouteParamsInterface;
    readonly strategy: CategorizeInboxStrategyInterface;
}

export const CategorizeInboxPage = ({ params, strategy }: Props) => (
    <ScreenChromeThemeProvider>
        <BottomChromeInsetProvider>
            <CategorizeInboxPageContent params={params} strategy={strategy} />
        </BottomChromeInsetProvider>
    </ScreenChromeThemeProvider>
);
