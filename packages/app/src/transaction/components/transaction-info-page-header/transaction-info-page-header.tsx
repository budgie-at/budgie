import { UserIconNameEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';

import { isDefined } from '@rnw-community/shared';

import { PageHeader } from '../../../@generic/component/page-header/page-header';
import { TransactionActionsMenu } from '../transaction-actions-menu/transaction-actions-menu';
import { TransactionActionsMenuSelector } from '../transaction-actions-menu/transaction-actions-menu.selector';
import { TransactionConvertMenuItem } from '../transaction-convert-menu-item/transaction-convert-menu-item';

import type { TransactionInfoPageHeaderPropsInterface } from '../../interface/transaction-info-page-header-props.interface';

export const TransactionInfoPageHeader = ({
    isConsolidated,
    onGoBack,
    onDelete,
    onRevert,
    onConvertToRefund,
    onConvertToTransfer
}: TransactionInfoPageHeaderPropsInterface) => {
    const { t } = useLingui();

    return (
        <PageHeader
            title=""
            size="md"
            onGoBack={onGoBack}
            right={
                <TransactionActionsMenu onDelete={onDelete} isConsolidated={isConsolidated} {...(isConsolidated && { onRevert })}>
                    {isDefined(onConvertToRefund) ? (
                        <TransactionConvertMenuItem
                            icon={UserIconNameEnum.ReceiptText}
                            label={t`Convert to Refund`}
                            onConvert={onConvertToRefund}
                            testID={TransactionActionsMenuSelector.ConvertToRefundButton}
                        />
                    ) : null}
                    {isDefined(onConvertToTransfer) ? (
                        <TransactionConvertMenuItem
                            icon={UserIconNameEnum.ArrowRightLeft}
                            label={t`Convert to Transfer`}
                            onConvert={onConvertToTransfer}
                            testID={TransactionActionsMenuSelector.ConvertToTransferButton}
                        />
                    ) : null}
                </TransactionActionsMenu>
            }
        />
    );
};
