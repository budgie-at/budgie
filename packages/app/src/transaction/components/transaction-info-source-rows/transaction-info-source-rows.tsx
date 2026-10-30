import { UserIconNameEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';

import { isDefined } from '@rnw-community/shared';

import { TransactionInfoGroup } from '../transaction-info-group/transaction-info-group';
import { TransactionInfoPageSelector } from '../transaction-info-page/transaction-info-page.selector';
import { TransactionInfoRow } from '../transaction-info-row/transaction-info-row';

import type { TransactionWithRelationsEntityInterface } from '@budgie/contracts';

interface Props {
    readonly transaction: TransactionWithRelationsEntityInterface;
    readonly onOpenRefundSources?: () => void;
    readonly onOpenConsolidationSources?: () => void;
}

export const TransactionInfoSourceRows = ({ transaction, onOpenConsolidationSources, onOpenRefundSources }: Props) => {
    const { t } = useLingui();
    const isConsolidated = isDefined(transaction.consolidationType);
    const handleOpenSources = onOpenConsolidationSources ?? onOpenRefundSources;
    const { receipt } = transaction;
    const showConsolidation = isConsolidated && isDefined(handleOpenSources);

    if (!showConsolidation && !isDefined(receipt)) {
        return null;
    }

    return (
        <TransactionInfoGroup>
            {showConsolidation ? (
                <TransactionInfoRow
                    icon={UserIconNameEnum.Workflow}
                    label={t`Consolidation`}
                    value={t`View source transactions`}
                    testID={TransactionInfoPageSelector.Row.Consolidation}
                    onPress={handleOpenSources}
                />
            ) : null}
            {isDefined(receipt) ? (
                <TransactionInfoRow
                    icon={UserIconNameEnum.Receipt}
                    label={t`Receipt`}
                    value={receipt.receiptNumber}
                    description={receipt.merchantLegalName}
                    testID={TransactionInfoPageSelector.Row.Receipt}
                />
            ) : null}
        </TransactionInfoGroup>
    );
};
