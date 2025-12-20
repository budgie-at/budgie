import { isDefined } from '@rnw-community/shared';

import { convertToMicroUnits } from '../../@generic/util/convert-to-micto-units.util';
import { getSignFromEntryType } from '../../transaction-entry/util/get-sign-from-entry-type.util';
import { TOLERANCE_MICRO } from '../constant/tolerance-micro.constant';
import { TransactionAssociationEnum } from '../enum/transaction-association.enum';
import { findCoreTransactionEntries } from '../util/find-core-transaction-entries.util';

import { BaseTransferTransactionCreateEntitySchema } from './base-transfer-transaction-create-entity.schema';


const ONE_SCALED = convertToMicroUnits(1);

export const TransferTransactionCreateEntitySchema = BaseTransferTransactionCreateEntitySchema.superRefine(
    ({ entries, exchangeRate, fromAccountId, toAccountId }, context) => {
        const { fromEntry, toEntry } = findCoreTransactionEntries(entries, fromAccountId, toAccountId);

        if (!isDefined(fromEntry) || !isDefined(toEntry)) {
            return;
        }

        const totalSignedFromMicroUnits = entries.reduce((acc, curr) => {
            let amountInFromCurrency: bigint = curr.amount;

            if (curr.accountId === toAccountId) {
                amountInFromCurrency = (curr.amount * exchangeRate) / ONE_SCALED;
            }

            const signedValue = BigInt(getSignFromEntryType(curr.type)) * amountInFromCurrency;

            return acc + signedValue;
        }, BigInt(0));

        const absDiff = totalSignedFromMicroUnits < BigInt(0) ? -totalSignedFromMicroUnits : totalSignedFromMicroUnits;

        if (absDiff > BigInt(TOLERANCE_MICRO)) {
            context.addIssue({
                code: 'custom',
                path: [TransactionAssociationEnum.ENTRIES],
                message: `entries do not balance: deviation of ${absDiff} micro units (tolerance ±${BigInt(TOLERANCE_MICRO)})`
            });
        }
    }
);
