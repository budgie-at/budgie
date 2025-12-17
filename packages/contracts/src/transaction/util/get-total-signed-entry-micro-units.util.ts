import { TransactionEntryCreateEntityInterface } from '../../transaction-entry/entity/transaction-entry-create-entity.interface';
import { getSignFromEntryType } from '../../transaction-entry/util/get-sign-from-entry-type.util';

export const getTotalSignedEntryMicroUnits = (
    entries: Pick<TransactionEntryCreateEntityInterface, 'accountId' | 'type' | 'amount'>[],
    accountId: number,
    rateScaled: number,
    convert: (value: number, rateScaled: number) => number
) =>
    entries.reduce((acc, curr) => {
        const amountInEntryCurrencyMicroUnits = curr.accountId === accountId ? convert(curr.amount, rateScaled) : curr.amount;

        const signedValue = getSignFromEntryType(curr.type) * amountInEntryCurrencyMicroUnits;

        return acc + signedValue;
    }, 0);
