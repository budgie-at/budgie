import { isDefined } from '@rnw-community/shared';

import { getSecurityTrade } from './get-security-trade.util';

import type { TransactionAssociationEnum, TransactionWithRelationsEntityInterface } from '@budgie/contracts';

export const isAccountBrokerageTrade = (
    transaction: Pick<TransactionWithRelationsEntityInterface, TransactionAssociationEnum.ENTRIES | 'toAccountId' | 'type'>,
    accountId: number | null
): boolean => {
    const trade = getSecurityTrade(transaction);

    return isDefined(trade) && (!isDefined(accountId) || accountId === trade.securityEntry.accountId);
};
