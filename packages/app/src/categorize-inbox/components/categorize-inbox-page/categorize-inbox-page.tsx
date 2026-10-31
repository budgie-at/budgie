import { BottomChromeInsetProvider } from '@rnw-community/react-native-screen-chrome';

import { GroupedSurface } from '../../../@generic/component/grouped-surface/grouped-surface';
import { ScreenChromeThemeProvider } from '../../../@generic/provider/screen-chrome-theme.provider';
import { CategorizeInboxPageContent } from '../categorize-inbox-page-content/categorize-inbox-page-content';

import type { AnalyticsTransactionsRouteParamsInterface } from '../../../transaction/interface/analytics-transactions-route-params.interface';

interface Props {
    readonly params: AnalyticsTransactionsRouteParamsInterface;
}

export const CategorizeInboxPage = ({ params }: Props) => (
    <GroupedSurface>
        <ScreenChromeThemeProvider>
            <BottomChromeInsetProvider>
                <CategorizeInboxPageContent params={params} />
            </BottomChromeInsetProvider>
        </ScreenChromeThemeProvider>
    </GroupedSurface>
);
