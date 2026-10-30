import { TransactionTypeEnum } from '@budgie/contracts';

import { isDefined } from '@rnw-community/shared';

import type { CategorizeInboxClusterTotalInterface } from '../interface/categorize-inbox-cluster-total.interface';
import type { CategorizeInboxClusterInterface } from '@budgie/categorization';

export const getCategorizeInboxClusterTotal = (
    { rows, totalBaseAmount }: Pick<CategorizeInboxClusterInterface, 'rows' | 'totalBaseAmount'>,
    defaultSymbol: string
): CategorizeInboxClusterTotalInterface => {
    const firstRow = rows.at(0);

    return {
        amount: totalBaseAmount ?? rows.reduce((sum, row) => sum + row.amount, 0),
        symbol: isDefined(totalBaseAmount) ? defaultSymbol : (firstRow?.instrumentSymbol ?? ''),
        sign: firstRow?.type === TransactionTypeEnum.INCOME ? '+' : ''
    };
};
