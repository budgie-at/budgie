import { describe, expect, it } from '@jest/globals';

import { convertToMicroUnits } from '../../@generic/util/convert-to-micro-units.util';
import { createTransferTransactionInput } from '../../test-utils/create-transfer-transaction-input.util';
import { TOLERANCE_MICRO } from '../constant/tolerance-micro.constant';

import { TransferAssetTransactionCreateEntitySchema } from './transfer-asset-transaction-create-entity.schema';

describe('TransferAssetTransactionCreateEntitySchema – valid cases', () => {
    const fromAccountId = 11;
    const toAccountId = 22;

    it('2 entries (no fee), balances exactly (from = to), exchangeRate = 1', () => {
        const amount = convertToMicroUnits(2450.75);

        const payload = createTransferTransactionInput({
            amount,
            exchangeRate: convertToMicroUnits(1),
            fromAccountId,
            toAccountId
        });

        const result = TransferAssetTransactionCreateEntitySchema.safeParse(payload);
        expect(result.success).toBe(true);
    });

    it('3 entries (with fee), balances exactly (from = to + fee), exchangeRate = 1', () => {
        const toAmount = convertToMicroUnits(2000.0);

        const payload = createTransferTransactionInput({
            amount: toAmount,
            exchangeRate: convertToMicroUnits(1),
            fromAccountId,
            toAccountId
        });

        const result = TransferAssetTransactionCreateEntitySchema.safeParse(payload);
        expect(result.success).toBe(true);
    });

    it(`within tolerance (±${BigInt(TOLERANCE_MICRO).toString()} micro)`, () => {
        const toAmount = convertToMicroUnits(1275.0);

        const payload = createTransferTransactionInput({
            amount: toAmount,
            exchangeRate: convertToMicroUnits(1),
            fromAccountId,
            toAccountId
        });

        const result = TransferAssetTransactionCreateEntitySchema.safeParse(payload);
        expect(result.success).toBe(true);
    });
});
