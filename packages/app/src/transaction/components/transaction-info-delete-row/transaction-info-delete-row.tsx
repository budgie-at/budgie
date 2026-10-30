import { TransactionConsolidationTypeEnum, UserIconNameEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';

import { isDefined } from '@rnw-community/shared';

import { TransactionInfoActionRow } from '../transaction-info-action-row/transaction-info-action-row';
import { TransactionInfoGroup } from '../transaction-info-group/transaction-info-group';
import { TransactionInfoPageSelector } from '../transaction-info-page/transaction-info-page.selector';

import type { TransactionWithRelationsEntityInterface } from '@budgie/contracts';

interface Props {
    readonly transaction: Pick<TransactionWithRelationsEntityInterface, 'consolidationType' | 'consolidationParentTransactionId'>;
    readonly onDelete: () => unknown;
}

export const TransactionInfoDeleteRow = ({ transaction, onDelete }: Props) => {
    const { t } = useLingui();
    const isRefund =
        isDefined(transaction.consolidationParentTransactionId) ||
        transaction.consolidationType === TransactionConsolidationTypeEnum.REFUND;
    const isConsolidated = isDefined(transaction.consolidationType);
    const separateLabel = isConsolidated ? t`Separate Transactions` : t`Delete Transaction`;
    const label = isRefund ? t`Undo Refund` : separateLabel;
    const separateIcon = isConsolidated ? UserIconNameEnum.Ungroup : UserIconNameEnum.Trash2;
    const icon = isRefund ? UserIconNameEnum.Undo2 : separateIcon;
    const handleDelete = () => void onDelete();

    return (
        <TransactionInfoGroup>
            <TransactionInfoActionRow
                icon={icon}
                label={label}
                onPress={handleDelete}
                testID={TransactionInfoPageSelector.DeleteButton}
                colorClassName="text-destructive-strong"
            />
        </TransactionInfoGroup>
    );
};
