import { UserIconNameEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';

import { isDefined } from '@rnw-community/shared';

import { TransactionInfoPageSelector } from '../transaction-info-page/transaction-info-page.selector';
import { TransactionInfoRow } from '../transaction-info-row/transaction-info-row';

import type { TransactionInfoSourceRowsPropsInterface } from '../../interface/transaction-info-source-rows-props.interface';

export const TransactionInfoSourceRows = ({ transaction, onOpenConsolidationSources }: TransactionInfoSourceRowsPropsInterface) => {
    const { t } = useLingui();
    const isConsolidated = isDefined(transaction.consolidationType);

    return (
        <>
            {isConsolidated && isDefined(onOpenConsolidationSources) ? (
                <TransactionInfoRow
                    icon={UserIconNameEnum.Workflow}
                    label={t`Consolidation`}
                    value={t`View source transactions`}
                    testID={TransactionInfoPageSelector.Row.Consolidation}
                    onPress={onOpenConsolidationSources}
                    withBottomBorder={false}
                />
            ) : null}
        </>
    );
};
