import { GroupedSurface } from '../../../@generic/component/grouped-surface/grouped-surface';
import { ScreenChromeThemeProvider } from '../../../@generic/provider/screen-chrome-theme.provider';

import type { PropsWithChildren } from 'react';

export const TransactionInfoPage = ({ children }: PropsWithChildren) => (
    <GroupedSurface>
        <ScreenChromeThemeProvider syncNativeScrollOffset>{children}</ScreenChromeThemeProvider>
    </GroupedSurface>
);
