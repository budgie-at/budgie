import { UserIconNameEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';

import { isDefined } from '@rnw-community/shared';

import { TransactionActionsMenu } from '../transaction-actions-menu/transaction-actions-menu';
import { TransactionActionsMenuSelector } from '../transaction-actions-menu/transaction-actions-menu.selector';
import { TransactionConvertMenuItem } from '../transaction-convert-menu-item/transaction-convert-menu-item';

import type { UpdateTransactionActionsMenuPropsInterface } from '../../interface/update-transaction-actions-menu-props.interface';

export const UpdateTransactionActionsMenu = ({
    onDelete,
    isConsolidated,
    onRevert,
    onConvertToRefund,
    onConvertToTransfer
}: UpdateTransactionActionsMenuPropsInterface) => {
    const { t } = useLingui();
    const showConvertToRefund = isDefined(onConvertToRefund);

    return (
        <TransactionActionsMenu onDelete={onDelete} isConsolidated={isConsolidated} {...(isConsolidated && { onRevert })}>
            {showConvertToRefund ? (
                <TransactionConvertMenuItem
                    icon={UserIconNameEnum.ReceiptText}
                    label={t`Convert to Refund`}
                    onConvert={onConvertToRefund}
                    testID={TransactionActionsMenuSelector.ConvertToRefundButton}
                />
            ) : null}
            <TransactionConvertMenuItem
                icon={UserIconNameEnum.ArrowRightLeft}
                label={t`Convert to Transfer`}
                onConvert={onConvertToTransfer}
                testID={TransactionActionsMenuSelector.ConvertToTransferButton}
            />
        </TransactionActionsMenu>
    );
};
