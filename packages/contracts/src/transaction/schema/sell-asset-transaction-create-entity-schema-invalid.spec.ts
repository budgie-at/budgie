import { describe, expect, it } from '@jest/globals';
import { prettifyError } from 'zod';

import { isDefined } from '@rnw-community/shared';

import { convertToMicroUnits } from '../../@generic/util/convert-to-micto-units.util';
import { createTransferTransactionEntryInput } from '../../test-utils/create-transfer-transaction-entry-input.util';
import { createTransferTransactionInput } from '../../test-utils/create-transfer-transaction-input.util';
import { TransactionEntryTypeEnum } from '../../transaction-entry/enum/transaction-entry-type.enum';
import { TOLERANCE_MICRO } from '../constant/tolerance-micro.constant';
import { TransactionAssociationEnum } from '../enum/transaction-association.enum';

import { SellAssetTransactionCreateEntitySchema } from './sell-asset-transaction-create-entity.schema';

describe('SellAssetTransactionCreateEntitySchema – invalid cases', () => {
    const fromAccountId = 11;
    const toAccountId = 22;
    const feeAccountId = 33;

    const ONE_SCALED = convertToMicroUnits(1);

    it('entries do not balance (beyond tolerance)', () => {
        const conversionRate = convertToMicroUnits(42.26);
        const fromAmount = convertToMicroUnits(5000.0);
        const fee = convertToMicroUnits(45.0);

        const converted = (fromAmount * conversionRate) / ONE_SCALED;
        const toAmount = converted - fee + (BigInt(TOLERANCE_MICRO) + 5n);

        const payload = createTransferTransactionInput({
            amount: toAmount,
            exchangeRate: conversionRate,
            toAccountId,
            fromAccountId,
            [TransactionAssociationEnum.ENTRIES]: [
                createTransferTransactionEntryInput(fromAccountId, TransactionEntryTypeEnum.CREDIT, fromAmount),
                createTransferTransactionEntryInput(toAccountId, TransactionEntryTypeEnum.DEBIT, toAmount),
                createTransferTransactionEntryInput(feeAccountId, TransactionEntryTypeEnum.DEBIT, fee)
            ]
        });

        const result = SellAssetTransactionCreateEntitySchema.safeParse(payload);

        expect(result.success).toBe(false);

        const error = isDefined(result.error) ? prettifyError(result.error) : '';

        expect(error).toContain('do not balance');
        expect(error).toContain(`at ${TransactionAssociationEnum.ENTRIES}`);
    });

    it('fromAccountId === toAccountId', () => {
        const conversionRate = convertToMicroUnits(1.17);
        const fromAmount = convertToMicroUnits(1170.0);
        const toAmount = convertToMicroUnits(1000.0);

        const payload = createTransferTransactionInput({
            amount: toAmount,
            exchangeRate: conversionRate,
            toAccountId: fromAccountId,
            fromAccountId,
            [TransactionAssociationEnum.ENTRIES]: [
                createTransferTransactionEntryInput(fromAccountId, TransactionEntryTypeEnum.CREDIT, fromAmount),
                createTransferTransactionEntryInput(fromAccountId, TransactionEntryTypeEnum.DEBIT, toAmount)
            ]
        });

        const result = SellAssetTransactionCreateEntitySchema.safeParse(payload);
        expect(result.success).toBe(false);

        const error = isDefined(result.error) ? prettifyError(result.error) : '';

        expect(error).toContain('must be different');
        expect(error).toContain(`at ${TransactionAssociationEnum.ENTRIES}`);
    });

    it('exchangeRate === 1 (per rule)', () => {
        const fromAmount = convertToMicroUnits(1500.0);
        const toAmount = convertToMicroUnits(1500.0);

        const payload = createTransferTransactionInput({
            amount: toAmount,
            exchangeRate: convertToMicroUnits(1),
            toAccountId,
            fromAccountId,
            [TransactionAssociationEnum.ENTRIES]: [
                createTransferTransactionEntryInput(fromAccountId, TransactionEntryTypeEnum.CREDIT, fromAmount),
                createTransferTransactionEntryInput(toAccountId, TransactionEntryTypeEnum.DEBIT, toAmount)
            ]
        });

        const result = SellAssetTransactionCreateEntitySchema.safeParse(payload);
        expect(result.success).toBe(false);

        const error = isDefined(result.error) ? prettifyError(result.error) : '';

        expect(error).toContain('must not be equal to 1');
        expect(error).toContain(`at exchangeRate`);
    });

    it('duplicate account ids in entries', () => {
        const conversionRate = convertToMicroUnits(156.07);
        const fromAmount = convertToMicroUnits(15607.0);
        const toAmount = convertToMicroUnits(100.0);

        const payload = createTransferTransactionInput({
            amount: toAmount,
            exchangeRate: conversionRate,
            toAccountId,
            fromAccountId,
            [TransactionAssociationEnum.ENTRIES]: [
                createTransferTransactionEntryInput(fromAccountId, TransactionEntryTypeEnum.CREDIT, fromAmount),
                createTransferTransactionEntryInput(toAccountId, TransactionEntryTypeEnum.DEBIT, toAmount),
                createTransferTransactionEntryInput(fromAccountId, TransactionEntryTypeEnum.DEBIT, convertToMicroUnits(50.0))
            ]
        });

        const result = SellAssetTransactionCreateEntitySchema.safeParse(payload);
        expect(result.success).toBe(false);

        const error = isDefined(result.error) ? prettifyError(result.error) : '';

        expect(error).toContain('each account may appear at most once');
        expect(error).toContain(`at ${TransactionAssociationEnum.ENTRIES}`);
    });

    it("wrong direction: from-entry must be 'credit'", () => {
        const conversionRate = convertToMicroUnits(1.34);
        const fromAmount = convertToMicroUnits(1000.0);

        const toAmount = (fromAmount * conversionRate) / ONE_SCALED;

        const payload = createTransferTransactionInput({
            amount: toAmount,
            exchangeRate: conversionRate,
            toAccountId,
            fromAccountId,
            [TransactionAssociationEnum.ENTRIES]: [
                createTransferTransactionEntryInput(fromAccountId, TransactionEntryTypeEnum.DEBIT, fromAmount),
                createTransferTransactionEntryInput(toAccountId, TransactionEntryTypeEnum.DEBIT, toAmount)
            ]
        });

        const result = SellAssetTransactionCreateEntitySchema.safeParse(payload);
        expect(result.success).toBe(false);

        const error = isDefined(result.error) ? prettifyError(result.error) : '';

        expect(error).toContain('"from" entry must be "credit"');
        expect(error).toContain(`at ${TransactionAssociationEnum.ENTRIES}[0].type`);
    });

    it("wrong direction: to-entry must be 'debit'", () => {
        const conversionRate = convertToMicroUnits(0.8);
        const fromAmount = convertToMicroUnits(1250.0);

        const toAmount = (fromAmount * conversionRate) / ONE_SCALED;

        const payload = createTransferTransactionInput({
            amount: toAmount,
            exchangeRate: conversionRate,
            toAccountId,
            fromAccountId,
            [TransactionAssociationEnum.ENTRIES]: [
                createTransferTransactionEntryInput(fromAccountId, TransactionEntryTypeEnum.CREDIT, fromAmount),
                createTransferTransactionEntryInput(toAccountId, TransactionEntryTypeEnum.CREDIT, toAmount)
            ]
        });

        const result = SellAssetTransactionCreateEntitySchema.safeParse(payload);
        expect(result.success).toBe(false);

        const error = isDefined(result.error) ? prettifyError(result.error) : '';

        expect(error).toContain('"to" entry must be "debit"');
        expect(error).toContain(`at ${TransactionAssociationEnum.ENTRIES}[1].type`);
    });

    it("fee entry must be 'debit' when present", () => {
        const conversionRate = convertToMicroUnits(42.26);
        const fromAmount = convertToMicroUnits(2000.0);
        const fee = convertToMicroUnits(18.0);

        const toAmount = (fromAmount * conversionRate) / ONE_SCALED - fee;

        const payload = createTransferTransactionInput({
            amount: toAmount,
            exchangeRate: conversionRate,
            toAccountId,
            fromAccountId,
            [TransactionAssociationEnum.ENTRIES]: [
                createTransferTransactionEntryInput(fromAccountId, TransactionEntryTypeEnum.CREDIT, fromAmount),
                createTransferTransactionEntryInput(toAccountId, TransactionEntryTypeEnum.DEBIT, toAmount),
                createTransferTransactionEntryInput(feeAccountId, TransactionEntryTypeEnum.CREDIT, fee)
            ]
        });

        const result = SellAssetTransactionCreateEntitySchema.safeParse(payload);
        expect(result.success).toBe(false);

        const error = isDefined(result.error) ? prettifyError(result.error) : '';

        expect(error).toContain('"fee" entry must be "debit"');
        expect(error).toContain(`at ${TransactionAssociationEnum.ENTRIES}[2].type`);
    });

    it('too few entries (min 2)', () => {
        const fromAmount = convertToMicroUnits(1170.0);

        const payload = createTransferTransactionInput({
            amount: convertToMicroUnits(1000.0),
            exchangeRate: convertToMicroUnits(1.17),
            toAccountId,
            fromAccountId,
            [TransactionAssociationEnum.ENTRIES]: [
                createTransferTransactionEntryInput(fromAccountId, TransactionEntryTypeEnum.CREDIT, fromAmount)
            ]
        });

        const result = SellAssetTransactionCreateEntitySchema.safeParse(payload);
        expect(result.success).toBe(false);

        const error = isDefined(result.error) ? prettifyError(result.error) : '';

        expect(error).toContain('Too small: expected array to have >=2');
        expect(error).toContain(`at ${TransactionAssociationEnum.ENTRIES}`);
    });

    it('too many entries (max 3)', () => {
        const conversionRate = convertToMicroUnits(156.07);
        const fromAmount = convertToMicroUnits(15607.0);
        const toAmount = convertToMicroUnits(100.0);

        const payload = createTransferTransactionInput({
            amount: toAmount,
            exchangeRate: conversionRate,
            toAccountId,
            fromAccountId,
            [TransactionAssociationEnum.ENTRIES]: [
                createTransferTransactionEntryInput(fromAccountId, TransactionEntryTypeEnum.CREDIT, fromAmount),
                createTransferTransactionEntryInput(toAccountId, TransactionEntryTypeEnum.DEBIT, toAmount),
                createTransferTransactionEntryInput(feeAccountId, TransactionEntryTypeEnum.DEBIT, convertToMicroUnits(12.0)),
                createTransferTransactionEntryInput(44, TransactionEntryTypeEnum.DEBIT, convertToMicroUnits(8.0))
            ]
        });

        const result = SellAssetTransactionCreateEntitySchema.safeParse(payload);
        expect(result.success).toBe(false);

        const error = isDefined(result.error) ? prettifyError(result.error) : '';

        expect(error).toContain('Too big: expected array to have <=3 items');
        expect(error).toContain(`at ${TransactionAssociationEnum.ENTRIES}`);
    });
});
