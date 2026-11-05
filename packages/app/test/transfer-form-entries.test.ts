import { TransactionEntryTypeEnum } from '@budgie/contracts';
import { describe, expect, it } from '@effect/vitest';

import { buildTransferEntries } from '../../ledger/src/transaction/utils/build-transfer-entries.util';
import { applyTransferDestinationAmount } from '../src/transaction/utils/apply-transfer-destination-amount.util';

describe('transfer form entries', () => {
    it.each([
        [800, 720],
        [25, 22.5],
        [4.700001, 4.700001],
        [4.700001, 3.100001]
    ])('keeps source %s and the displayed destination %s distinct', (amount, destinationAmount) => {
        const entries = applyTransferDestinationAmount(
            buildTransferEntries({ fromAccountId: 1, toAccountId: 2, amount }),
            destinationAmount
        );

        expect(entries.find(entry => entry.type === TransactionEntryTypeEnum.CREDIT)?.amount).toBe(amount);
        expect(entries.find(entry => entry.type === TransactionEntryTypeEnum.DEBIT)?.amount).toBe(destinationAmount);
    });
});
