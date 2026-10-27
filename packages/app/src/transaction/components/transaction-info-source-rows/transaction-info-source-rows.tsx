import { UserIconNameEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';

import { isDefined, isNotEmptyString } from '@rnw-community/shared';

import { TransactionInfoPageSelector } from '../transaction-info-page/transaction-info-page.selector';
import { TransactionInfoRow } from '../transaction-info-row/transaction-info-row';
import { TransactionMetaPill } from '../transaction-meta-pill/transaction-meta-pill';

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
    const vatPill = isNotEmptyString(receipt?.merchantVatId) ? <TransactionMetaPill label={receipt.merchantVatId} /> : null;

    return (
        <>
            {isConsolidated && isDefined(handleOpenSources) ? (
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
                >
                    {vatPill}
                </TransactionInfoRow>
            ) : null}
        </>
    );
};
