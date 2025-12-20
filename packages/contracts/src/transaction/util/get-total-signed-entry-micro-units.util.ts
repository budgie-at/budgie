import { PRECISION } from '../../@generic/constant/precision.constant';
import { TransactionEntryCreateEntityInterface } from '../../transaction-entry/entity/transaction-entry-create-entity.interface';
import { getSignFromEntryType } from '../../transaction-entry/util/get-sign-from-entry-type.util';

export const getTotalSignedEntryMicroUnits = (
    entries: Pick<TransactionEntryCreateEntityInterface, 'accountId' | 'type' | 'amount'>[],
    fromAccountId: number,
    exchangeRateScaled: bigint
): bigint =>
    entries.reduce((acc, curr) => {
        const amountInFromCurrencyMicro =
            curr.accountId === fromAccountId ? (curr.amount * exchangeRateScaled) / BigInt(PRECISION) : curr.amount;

        const signedValue = BigInt(getSignFromEntryType(curr.type)) * amountInFromCurrencyMicro;

        return acc + signedValue;
    }, BigInt(0));
