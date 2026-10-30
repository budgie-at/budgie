import { GroupedSurface } from '../../../@generic/component/grouped-surface/grouped-surface';
import { ScreenChromeThemeProvider } from '../../../@generic/provider/screen-chrome-theme.provider';
import { useTransactionInfoChromeConfig } from '../../hook/use-transaction-info-chrome-config.hook';
import { RefundTransactionInfoContent } from '../refund-transaction-info-content/refund-transaction-info-content';

import type { TransactionWithRelationsEntityInterface } from '@budgie/contracts';

interface Props {
    readonly transaction: TransactionWithRelationsEntityInterface;
    readonly parentTransaction: TransactionWithRelationsEntityInterface;
}

export const RefundTransactionInfoPage = (props: Props) => {
    const config = useTransactionInfoChromeConfig();

    return (
        <GroupedSurface>
            <ScreenChromeThemeProvider syncNativeScrollOffset config={config}>
                <RefundTransactionInfoContent {...props} />
            </ScreenChromeThemeProvider>
        </GroupedSurface>
    );
};
