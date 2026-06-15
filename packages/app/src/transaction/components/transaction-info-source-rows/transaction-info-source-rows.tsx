import { UserIconNameEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';

import { isDefined } from '@rnw-community/shared';

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

    return (
        <>
            {isConsolidated && isDefined(handleOpenSources) ? (
                <TransactionInfoRow
                    icon={UserIconNameEnum.Workflow}
                    label={t`Consolidation`}
                    value={t`View source transactions`}
                    testID={TransactionInfoPageSelector.Row.Consolidation}
                    onPress={handleOpenSources}
                    withBottomBorder={false}
                />
            ) : null}
        </>
    );
};
