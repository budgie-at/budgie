import { UserIconNameEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';

import { isDefined } from '@rnw-community/shared';

import { TransactionActionsMenu } from '../transaction-actions-menu/transaction-actions-menu';
import { TransactionActionsMenuSelector } from '../transaction-actions-menu/transaction-actions-menu.selector';
import { TransactionConvertMenuItem } from '../transaction-convert-menu-item/transaction-convert-menu-item';

import type { TransactionActionsMenuPropsInterface } from '../../interface/transaction-actions-menu-props.interface';

interface Props extends Pick<TransactionActionsMenuPropsInterface, 'onDelete' | 'isConsolidated' | 'onRevert'> {
    readonly onFeePress?: () => void;
    readonly onAttachDebtSettlement?: () => void;
    readonly attachDebtSettlementLabel?: string;
    readonly onConvertToRefund?: () => void;
    readonly onConvertToTransfer?: () => void;
    readonly onStartDeposit?: () => void;
    readonly onConvertToInstallment?: () => void;
    readonly onDetachDebtSettlement?: () => void;
}

export const UpdateTransactionActionsMenu = ({
    onDelete,
    isConsolidated,
    onRevert,
    onFeePress,
    onAttachDebtSettlement,
    attachDebtSettlementLabel,
    onConvertToRefund,
    onConvertToTransfer,
    onStartDeposit,
    onConvertToInstallment,
    onDetachDebtSettlement
}: Props) => {
    const { t } = useLingui();
    const showFee = isDefined(onFeePress);
    const showAttachDebtSettlement = isDefined(onAttachDebtSettlement);
    const showConvertToRefund = isDefined(onConvertToRefund);
    const showConvertToTransfer = isDefined(onConvertToTransfer);
    const showStartDeposit = isDefined(onStartDeposit);
    const showConvertToInstallment = isDefined(onConvertToInstallment);
    const showDetachDebtSettlement = isDefined(onDetachDebtSettlement);

    return (
        <TransactionActionsMenu onDelete={onDelete} isConsolidated={isConsolidated} {...(isConsolidated && { onRevert })}>
            {showFee ? (
                <TransactionConvertMenuItem
                    icon={UserIconNameEnum.ReceiptText}
                    label={t`Set fee`}
                    onConvert={onFeePress}
                    testID={TransactionActionsMenuSelector.FeeButton}
                />
            ) : null}
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
            {showConvertToInstallment ? (
                <TransactionConvertMenuItem
                    icon={UserIconNameEnum.CalendarClock}
                    label={t`Pay in parts`}
                    onConvert={onConvertToInstallment}
                    testID={TransactionActionsMenuSelector.ConvertToInstallmentButton}
                />
            ) : null}
            {showStartDeposit ? (
                <TransactionConvertMenuItem
                    icon={UserIconNameEnum.Landmark}
                    label={t`Start Deposit`}
                    onConvert={onStartDeposit}
                    testID={TransactionActionsMenuSelector.StartDepositButton}
                />
            ) : null}
        </TransactionActionsMenu>
    );
};
