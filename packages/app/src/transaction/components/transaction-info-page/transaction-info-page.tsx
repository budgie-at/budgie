import { GroupedSurface } from '../../../@generic/component/grouped-surface/grouped-surface';
import { ScreenChromeThemeProvider } from '../../../@generic/provider/screen-chrome-theme.provider';
import { TransactionInfoPageContent } from '../transaction-info-page-content/transaction-info-page-content';

import type { TransactionInfoPagePropsInterface } from '../../interface/transaction-info-page-props.interface';

export const TransactionInfoPage = (props: TransactionInfoPagePropsInterface) => (
    <GroupedSurface>
        <ScreenChromeThemeProvider syncNativeScrollOffset>
            <TransactionInfoPageContent {...props} />
        </ScreenChromeThemeProvider>
    </GroupedSurface>
);
