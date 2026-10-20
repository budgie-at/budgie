import { BottomChromeInsetProvider } from '@rnw-community/react-native-screen-chrome';

import { ScreenChromeThemeProvider } from '../../../@generic/provider/screen-chrome-theme.provider';
import { TransactionInfoPageContent } from '../transaction-info-page-content/transaction-info-page-content';

import type { TransactionInfoPagePropsInterface } from '../../interface/transaction-info-page-props.interface';

export const TransactionInfoPage = (props: TransactionInfoPagePropsInterface) => (
    <ScreenChromeThemeProvider>
        <BottomChromeInsetProvider>
            <TransactionInfoPageContent {...props} />
        </BottomChromeInsetProvider>
    </ScreenChromeThemeProvider>
);
