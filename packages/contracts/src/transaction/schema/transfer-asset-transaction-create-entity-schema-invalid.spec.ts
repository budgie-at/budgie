import { describe, expect, it } from '@jest/globals';
import { prettifyError } from 'zod';

import { isDefined } from '@rnw-community/shared';

import { convertToMicroUnits } from '../../@generic/util/convert-to-micto-units.util';
import { createTransferTransactionEntryInput } from '../../test-utils/create-transfer-transaction-entry-input.util';
import { createTransferTransactionInput } from '../../test-utils/create-transfer-transaction-input.util';
import { TransactionEntryTypeEnum } from '../../transaction-entry/enum/transaction-entry-type.enum';
import { TOLERANCE_MICRO } from '../constant/tolerance-micro.constant';
import { TransactionAssociationEnum } from '../enum/transaction-association.enum';

import { TransferAssetTransactionCreateEntitySchema } from './transfer-asset-transaction-create-entity.schema';

describe('TransferAssetTransactionCreateEntitySchema – invalid cases', () => {
    const fromAccountId = 11;
    const toAccountId = 22;
    const feeAccountId = 33;

    it('entries do not balance (beyond tolerance)', () => {
        const toAmount = convertToMicroUnits(2450.75);
        const fee = convertToMicroUnits(12.5);
        const extra = BigInt(TOLERANCE_MICRO) + 5n;
        const fromAmount = toAmount + fee + extra;

        const payload = createTransferTransactionInput({
            amount: toAmount,
            exchangeRate: convertToMicroUnits(1),
            fromAccountId,
            toAccountId,
            [TransactionAssociationEnum.ENTRIES]: [
                createTransferTransactionEntryInput(fromAccountId, TransactionEntryTypeEnum.CREDIT, fromAmount),
                createTransferTransactionEntryInput(toAccountId, TransactionEntryTypeEnum.DEBIT, toAmount),
                createTransferTransactionEntryInput(feeAccountId, TransactionEntryTypeEnum.DEBIT, fee)
            ]
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
            toAccountId,
            [TransactionAssociationEnum.ENTRIES]: [
                createTransferTransactionEntryInput(fromAccountId, TransactionEntryTypeEnum.CREDIT, amount),
                createTransferTransactionEntryInput(toAccountId, TransactionEntryTypeEnum.DEBIT, amount)
            ]
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
            toAccountId: fromAccountId,
            [TransactionAssociationEnum.ENTRIES]: [
                createTransferTransactionEntryInput(fromAccountId, TransactionEntryTypeEnum.CREDIT, amount),
                createTransferTransactionEntryInput(fromAccountId, TransactionEntryTypeEnum.DEBIT, amount)
            ]
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
            toAccountId,
            [TransactionAssociationEnum.ENTRIES]: [
                createTransferTransactionEntryInput(fromAccountId, TransactionEntryTypeEnum.CREDIT, convertToMicroUnits(1200.0)),
                createTransferTransactionEntryInput(toAccountId, TransactionEntryTypeEnum.DEBIT, convertToMicroUnits(1000.0)),
                createTransferTransactionEntryInput(fromAccountId, TransactionEntryTypeEnum.DEBIT, convertToMicroUnits(200.0))
            ]
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
            toAccountId,
            [TransactionAssociationEnum.ENTRIES]: [
                createTransferTransactionEntryInput(fromAccountId, TransactionEntryTypeEnum.DEBIT, amount),
                createTransferTransactionEntryInput(toAccountId, TransactionEntryTypeEnum.DEBIT, amount)
            ]
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
            toAccountId,
            [TransactionAssociationEnum.ENTRIES]: [
                createTransferTransactionEntryInput(fromAccountId, TransactionEntryTypeEnum.CREDIT, amount),
                createTransferTransactionEntryInput(toAccountId, TransactionEntryTypeEnum.CREDIT, amount)
            ]
        });

        const result = TransferAssetTransactionCreateEntitySchema.safeParse(payload);
        expect(result.success).toBe(false);

        const error = isDefined(result.error) ? prettifyError(result.error) : '';

        expect(error).toContain('"to" entry must be "debit"');
        expect(error).toContain(`at ${TransactionAssociationEnum.ENTRIES}[1].type`);
    });

    it("fee entry must be 'debit' when present", () => {
        const toAmount = convertToMicroUnits(2450.75);
        const fee = convertToMicroUnits(8.5);
        const fromAmount = toAmount + fee;

        const payload = createTransferTransactionInput({
            amount: toAmount,
            exchangeRate: convertToMicroUnits(1),
            fromAccountId,
            toAccountId,
            [TransactionAssociationEnum.ENTRIES]: [
                createTransferTransactionEntryInput(fromAccountId, TransactionEntryTypeEnum.CREDIT, fromAmount),
                createTransferTransactionEntryInput(toAccountId, TransactionEntryTypeEnum.DEBIT, toAmount),
                createTransferTransactionEntryInput(feeAccountId, TransactionEntryTypeEnum.CREDIT, fee)
            ]
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
            toAccountId,
            [TransactionAssociationEnum.ENTRIES]: [
                createTransferTransactionEntryInput(fromAccountId, TransactionEntryTypeEnum.CREDIT, convertToMicroUnits(500.0))
            ]
        });

        const result = TransferAssetTransactionCreateEntitySchema.safeParse(payload);
        expect(result.success).toBe(false);

        const error = isDefined(result.error) ? prettifyError(result.error) : '';

        expect(error).toContain('Too small: expected array to have >=2');
        expect(error).toContain(`at ${TransactionAssociationEnum.ENTRIES}`);
    });

    it('too many entries (max 3)', () => {
        const mockAccountId = 44;

        const payload = createTransferTransactionInput({
            amount: convertToMicroUnits(1150.0),
            exchangeRate: convertToMicroUnits(1),
            fromAccountId,
            toAccountId,
            [TransactionAssociationEnum.ENTRIES]: [
                createTransferTransactionEntryInput(fromAccountId, TransactionEntryTypeEnum.CREDIT, convertToMicroUnits(1200.0)),
                createTransferTransactionEntryInput(toAccountId, TransactionEntryTypeEnum.DEBIT, convertToMicroUnits(1150.0)),
                createTransferTransactionEntryInput(feeAccountId, TransactionEntryTypeEnum.DEBIT, convertToMicroUnits(50.0)),
                createTransferTransactionEntryInput(mockAccountId, TransactionEntryTypeEnum.DEBIT, convertToMicroUnits(10.0))
            ]
        });

        const result = TransferAssetTransactionCreateEntitySchema.safeParse(payload);
        expect(result.success).toBe(false);

        const error = isDefined(result.error) ? prettifyError(result.error) : '';

        expect(error).toContain('Too big: expected array to have <=3 items');
        expect(error).toContain(`at ${TransactionAssociationEnum.ENTRIES}`);
    });
});
