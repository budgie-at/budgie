import { describe, expect, it } from '@jest/globals';
import { prettifyError } from 'zod';

import { isDefined } from '@rnw-community/shared';

import { convertToMicroUnits } from '../../@generic/util/convert-to-micro-units.util';
import { createTransferTransactionInput } from '../../test-utils/create-transfer-transaction-input.util';
import { TransactionAssociationEnum } from '../enum/transaction-association.enum';

import { TransferAssetTransactionCreateEntitySchema } from './transfer-asset-transaction-create-entity.schema';

describe('TransferAssetTransactionCreateEntitySchema – invalid cases', () => {
    const fromAccountId = 11;
    const toAccountId = 22;

    it('entries do not balance (beyond tolerance)', () => {
        const toAmount = convertToMicroUnits(2450.75);

        const payload = createTransferTransactionInput({
            amount: toAmount,
            exchangeRate: convertToMicroUnits(1),
            fromAccountId,
            toAccountId
        });

        const result = TransferAssetTransactionCreateEntitySchema.safeParse(payload);
        expect(result.success).toBe(false);

        const error = isDefined(result.error) ? prettifyError(result.error) : '';

        expect(error).toContain('do not balance');
        expect(error).toContain(`at ${TransactionAssociationEnum.ENTRIES}`);
    });

    it('exchangeRate !== 1', () => {
        const amount = convertToMicroUnits(1500.0);

        const payload = createTransferTransactionInput({
            amount,
            exchangeRate: convertToMicroUnits(1.17),
            fromAccountId,
            toAccountId
        });

        const result = TransferAssetTransactionCreateEntitySchema.safeParse(payload);
        expect(result.success).toBe(false);

        const error = isDefined(result.error) ? prettifyError(result.error) : '';

        expect(error).toContain('must be equal to 1');
        expect(error).toContain(`at exchangeRate`);
    });

    it('fromAccountId === toAccountId', () => {
        const amount = convertToMicroUnits(890.0);

        const payload = createTransferTransactionInput({
            amount,
            exchangeRate: convertToMicroUnits(1),
            fromAccountId,
            toAccountId: fromAccountId
        });

        const result = TransferAssetTransactionCreateEntitySchema.safeParse(payload);
        expect(result.success).toBe(false);

        const error = isDefined(result.error) ? prettifyError(result.error) : '';

        expect(error).toContain('must be different');
        expect(error).toContain(`at ${TransactionAssociationEnum.ENTRIES}`);
    });

    it('duplicate account ids in entries', () => {
        const payload = createTransferTransactionInput({
            amount: convertToMicroUnits(1000.0),
            exchangeRate: convertToMicroUnits(1),
            fromAccountId,
            toAccountId
        });

        const result = TransferAssetTransactionCreateEntitySchema.safeParse(payload);
        expect(result.success).toBe(false);

        const error = isDefined(result.error) ? prettifyError(result.error) : '';

        expect(error).toContain('each account may appear at most once');
        expect(error).toContain(`at ${TransactionAssociationEnum.ENTRIES}`);
    });

    it("from-entry must be 'credit'", () => {
        const amount = convertToMicroUnits(3250.8);

        const payload = createTransferTransactionInput({
            amount,
            exchangeRate: convertToMicroUnits(1),
            fromAccountId,
            toAccountId
        });

        const result = TransferAssetTransactionCreateEntitySchema.safeParse(payload);
        expect(result.success).toBe(false);

        const error = isDefined(result.error) ? prettifyError(result.error) : '';

        expect(error).toContain('"from" entry must be "credit"');
        expect(error).toContain(`at ${TransactionAssociationEnum.ENTRIES}[0].type`);
    });

    it("to-entry must be 'debit'", () => {
        const amount = convertToMicroUnits(127.43);

        const payload = createTransferTransactionInput({
            amount,
            exchangeRate: convertToMicroUnits(1),
            fromAccountId,
            toAccountId
        });

        const result = TransferAssetTransactionCreateEntitySchema.safeParse(payload);
        expect(result.success).toBe(false);

        const error = isDefined(result.error) ? prettifyError(result.error) : '';

        expect(error).toContain('"to" entry must be "debit"');
        expect(error).toContain(`at ${TransactionAssociationEnum.ENTRIES}[1].type`);
    });

    it("fee entry must be 'debit' when present", () => {
        const toAmount = convertToMicroUnits(2450.75);

        const payload = createTransferTransactionInput({
            amount: toAmount,
            exchangeRate: convertToMicroUnits(1),
            fromAccountId,
            toAccountId
        });

        const result = TransferAssetTransactionCreateEntitySchema.safeParse(payload);
        expect(result.success).toBe(false);

        const error = isDefined(result.error) ? prettifyError(result.error) : '';

        expect(error).toContain('"fee" entry must be "debit"');
        expect(error).toContain(`at ${TransactionAssociationEnum.ENTRIES}[2].type`);
    });

    it('too few entries (min 2)', () => {
        const payload = createTransferTransactionInput({
            amount: convertToMicroUnits(500.0),
            exchangeRate: convertToMicroUnits(1),
            fromAccountId,
            toAccountId
        });

        const result = TransferAssetTransactionCreateEntitySchema.safeParse(payload);
        expect(result.success).toBe(false);

        const error = isDefined(result.error) ? prettifyError(result.error) : '';

        expect(error).toContain('Too small: expected array to have >=2');
        expect(error).toContain(`at ${TransactionAssociationEnum.ENTRIES}`);
    });

    it('too many entries (max 3)', () => {
        const payload = createTransferTransactionInput({
            amount: convertToMicroUnits(1150.0),
            exchangeRate: convertToMicroUnits(1),
            fromAccountId,
            toAccountId
        });

        const result = TransferAssetTransactionCreateEntitySchema.safeParse(payload);
        expect(result.success).toBe(false);

        const error = isDefined(result.error) ? prettifyError(result.error) : '';

        expect(error).toContain('Too big: expected array to have <=3 items');
        expect(error).toContain(`at ${TransactionAssociationEnum.ENTRIES}`);
    });
});
