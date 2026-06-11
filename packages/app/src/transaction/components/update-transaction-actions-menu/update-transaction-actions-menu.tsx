import { UserIconNameEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';

import { isDefined } from '@rnw-community/shared';

import { TransactionActionsMenu } from '../transaction-actions-menu/transaction-actions-menu';
import { TransactionActionsMenuSelector } from '../transaction-actions-menu/transaction-actions-menu.selector';
import { TransactionConvertMenuItem } from '../transaction-convert-menu-item/transaction-convert-menu-item';

import type { TransactionActionsMenuPropsInterface } from '../../interface/transaction-actions-menu-props.interface';

interface Props extends Pick<TransactionActionsMenuPropsInterface, 'onDelete' | 'isConsolidated'> {
    readonly onRevert: () => void;
    readonly onAttachDebtSettlement?: () => void;
    readonly attachDebtSettlementLabel?: string;
    readonly onConvertToRefund?: () => void;
    readonly onConvertToTransfer?: () => void;
    readonly onDetachDebtSettlement?: () => void;
}

export const UpdateTransactionActionsMenu = ({
    onDelete,
    isConsolidated,
    onRevert,
    onAttachDebtSettlement,
    attachDebtSettlementLabel,
    onConvertToRefund,
    onConvertToTransfer,
    onDetachDebtSettlement
}: Props) => {
    const { t } = useLingui();
    const showAttachDebtSettlement = isDefined(onAttachDebtSettlement);
    const showConvertToRefund = isDefined(onConvertToRefund);
    const showConvertToTransfer = isDefined(onConvertToTransfer);
    const showDetachDebtSettlement = isDefined(onDetachDebtSettlement);

    return (
        <TransactionActionsMenu onDelete={onDelete} isConsolidated={isConsolidated} {...(isConsolidated && { onRevert })}>
            {showAttachDebtSettlement ? (
                <TransactionConvertMenuItem
                    icon={UserIconNameEnum.HandCoins}
                    label={attachDebtSettlementLabel ?? t`Attach debt`}
                    onConvert={onAttachDebtSettlement}
                    testID={TransactionActionsMenuSelector.AttachDebtSettlementButton}
                />
            ) : null}
            {showDetachDebtSettlement ? (
                <TransactionConvertMenuItem
                    icon={UserIconNameEnum.Unlink}
                    label={t`Detach debt`}
                    onConvert={onDetachDebtSettlement}
                    testID={TransactionActionsMenuSelector.DetachDebtSettlementButton}
                />
            ) : null}
            {showConvertToRefund ? (
                <TransactionConvertMenuItem
                    icon={UserIconNameEnum.ReceiptText}
                    label={t`Convert to Refund`}
                    onConvert={onConvertToRefund}
                    testID={TransactionActionsMenuSelector.ConvertToRefundButton}
                />
            ) : null}
            {showConvertToTransfer ? (
                <TransactionConvertMenuItem
                    icon={UserIconNameEnum.ArrowRightLeft}
                    label={t`Convert to Transfer`}
                    onConvert={onConvertToTransfer}
                    testID={TransactionActionsMenuSelector.ConvertToTransferButton}
                />
            ) : null}
        </TransactionActionsMenu>
    );
};
