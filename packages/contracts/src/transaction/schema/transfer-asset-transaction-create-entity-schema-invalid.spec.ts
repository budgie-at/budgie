import { describe, expect, it } from '@jest/globals';
import { prettifyError } from 'zod';

import { isDefined } from '@rnw-community/shared';

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
        const toMicro = 2_000_000;
        const feeMicro = 300_000;
        const extra = TOLERANCE_MICRO + 5;
        const fromMicro = toMicro + feeMicro + extra;

        const payload = createTransferTransactionInput({
            exchangeRate: 1,
            fromAccountId,
            toAccountId,
            [TransactionAssociationEnum.ENTRIES]: [
                createTransferTransactionEntryInput(fromAccountId, TransactionEntryTypeEnum.CREDIT, fromMicro),
                createTransferTransactionEntryInput(toAccountId, TransactionEntryTypeEnum.DEBIT, toMicro),
                createTransferTransactionEntryInput(feeAccountId, TransactionEntryTypeEnum.DEBIT, feeMicro)
            ]
        });

        const result = TransferAssetTransactionCreateEntitySchema.safeParse(payload);
        expect(result.success).toBe(false);

        const error = isDefined(result.error) ? prettifyError(result.error) : '';

        expect(error).toContain('do not balance');
        expect(error).toContain(`at ${TransactionAssociationEnum.ENTRIES}`);
    });

    it('exchangeRate !== 1', () => {
        const amount = 1_000;

        const payload = createTransferTransactionInput({
            exchangeRate: 2,
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
        const amount = 100;

        const payload = createTransferTransactionInput({
            exchangeRate: 1,
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
            exchangeRate: 1,
            fromAccountId,
            toAccountId,
            [TransactionAssociationEnum.ENTRIES]: [
                createTransferTransactionEntryInput(fromAccountId, TransactionEntryTypeEnum.CREDIT, 100),
                createTransferTransactionEntryInput(toAccountId, TransactionEntryTypeEnum.DEBIT, 50),
                createTransferTransactionEntryInput(fromAccountId, TransactionEntryTypeEnum.DEBIT, 50)
            ]
        });

        const result = TransferAssetTransactionCreateEntitySchema.safeParse(payload);
        expect(result.success).toBe(false);

        const error = isDefined(result.error) ? prettifyError(result.error) : '';

        expect(error).toContain('each account may appear at most once');
        expect(error).toContain(`at ${TransactionAssociationEnum.ENTRIES}`);
    });

    it("from-entry must be 'credit'", () => {
        const amount = 1_000;

        const payload = createTransferTransactionInput({
            exchangeRate: 1,
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
        const amount = 1_000;

        const payload = createTransferTransactionInput({
            exchangeRate: 1,
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
        const toMicro = 1_000_000;
        const feeMicro = 10_000;
        const fromMicro = toMicro + feeMicro;

        const payload = createTransferTransactionInput({
            exchangeRate: 1,
            fromAccountId,
            toAccountId,
            [TransactionAssociationEnum.ENTRIES]: [
                createTransferTransactionEntryInput(fromAccountId, TransactionEntryTypeEnum.CREDIT, fromMicro),
                createTransferTransactionEntryInput(toAccountId, TransactionEntryTypeEnum.DEBIT, toMicro),
                createTransferTransactionEntryInput(feeAccountId, TransactionEntryTypeEnum.CREDIT, feeMicro)
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
            exchangeRate: 1,
            fromAccountId,
            toAccountId,
            [TransactionAssociationEnum.ENTRIES]: [createTransferTransactionEntryInput(fromAccountId, TransactionEntryTypeEnum.CREDIT, 100)]
        });

        const result = TransferAssetTransactionCreateEntitySchema.safeParse(payload);
        expect(result.success).toBe(false);

        const error = isDefined(result.error) ? prettifyError(result.error) : '';

        expect(error).toContain('Too small: expected array to have >=2 items');
        expect(error).toContain(`at ${TransactionAssociationEnum.ENTRIES}`);
    });

    it('too many entries (max 3)', () => {
        const mockAccountId = 44;

        const payload = createTransferTransactionInput({
            exchangeRate: 1,
            fromAccountId,
            toAccountId,
            [TransactionAssociationEnum.ENTRIES]: [
                createTransferTransactionEntryInput(fromAccountId, TransactionEntryTypeEnum.CREDIT, 100),
                createTransferTransactionEntryInput(toAccountId, TransactionEntryTypeEnum.DEBIT, 90),
                createTransferTransactionEntryInput(feeAccountId, TransactionEntryTypeEnum.DEBIT, 10),
                createTransferTransactionEntryInput(mockAccountId, TransactionEntryTypeEnum.DEBIT, 1)
            ]
        });

        const result = TransferAssetTransactionCreateEntitySchema.safeParse(payload);
        expect(result.success).toBe(false);

        const error = isDefined(result.error) ? prettifyError(result.error) : '';

        expect(error).toContain('Too big: expected array to have <=3 items');
        expect(error).toContain(`at ${TransactionAssociationEnum.ENTRIES}`);
    });
});
