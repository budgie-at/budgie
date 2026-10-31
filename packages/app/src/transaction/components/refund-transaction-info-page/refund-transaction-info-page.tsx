import { GroupedSurface } from '../../../@generic/component/grouped-surface/grouped-surface';
import { ScreenChromeThemeProvider } from '../../../@generic/provider/screen-chrome-theme.provider';
import { RefundTransactionInfoContent } from '../refund-transaction-info-content/refund-transaction-info-content';

import type { TransactionWithRelationsEntityInterface } from '@budgie/contracts';

interface Props {
    readonly transaction: TransactionWithRelationsEntityInterface;
    readonly parentTransaction: TransactionWithRelationsEntityInterface;
}

export const RefundTransactionInfoPage = (props: Props) => (
    <GroupedSurface>
        <ScreenChromeThemeProvider syncNativeScrollOffset>
            <RefundTransactionInfoContent {...props} />
        </ScreenChromeThemeProvider>
    </GroupedSurface>
);
