import {
    BANK_AUTHORITATIVE_ACCOUNT_TYPES,
    SyncModeEnum,
    TransactionEntryTypeEnum,
    convertFromMicroUnits,
    isPositiveAdjustmentTransaction
} from '@budgie/contracts';

import { isDefined } from '@rnw-community/shared';

import type { AdjustmentTransactionDetailsInterface } from '../interface/adjustment-transaction-details.interface';
import type { SyncEntityInterface, TransactionWithRelationsEntityInterface } from '@budgie/contracts';

export const getAdjustmentDetails = (
    transaction: TransactionWithRelationsEntityInterface,
    sync: Pick<SyncEntityInterface, 'mode' | 'reconciledAt' | 'reconciledBalance' | 'reconciliationTransactionId'> | null
): AdjustmentTransactionDetailsInterface | null => {
    const initialIsIncrease = isPositiveAdjustmentTransaction(transaction);
    const entryType = initialIsIncrease ? TransactionEntryTypeEnum.DEBIT : TransactionEntryTypeEnum.CREDIT;
    const entry = transaction.entries.find(item => item.type === entryType);

    if (!isDefined(entry)) {
        return null;
    }

    const isBankAuthoritative = BANK_AUTHORITATIVE_ACCOUNT_TYPES.includes(entry.account.type);
    const reconciledAt = sync?.mode === SyncModeEnum.FORWARD && isDefined(sync.reconciledBalance) ? sync.reconciledAt : null;

    return {
        isAmountReadOnly: isBankAuthoritative || (isDefined(reconciledAt) && sync?.reconciliationTransactionId === transaction.id),
        isBalanceFixed: isBankAuthoritative || (isDefined(reconciledAt) && transaction.operatedAt <= reconciledAt),
        accountId: entry.accountId,
        accountTitle: entry.account.title,
        accountIcon: entry.account.icon,
        instrumentCode: entry.account.instrument.code,
        instrumentSymbol: entry.account.instrument.symbol,
        initialAmount: convertFromMicroUnits(entry.amount),
        initialIsIncrease,
        entry
    };
};
