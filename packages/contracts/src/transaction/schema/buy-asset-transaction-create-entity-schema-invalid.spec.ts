import { describe, expect, it } from '@jest/globals';
import { prettifyError } from 'zod';

import { isDefined } from '@rnw-community/shared';

import { createTransferTransactionEntryInput } from '../../test-utils/create-transfer-transaction-entry-input.util';
import { createTransferTransactionInput } from '../../test-utils/create-transfer-transaction-input.util';
import { quoteMicroToBaseMicro } from '../../test-utils/quote-micro-to-base-micro.util';
import { TransactionEntryTypeEnum } from '../../transaction-entry/enum/transaction-entry-type.enum';
import { TOLERANCE_MICRO } from '../constant/tolerance-micro.constant';
import { TransactionAssociationEnum } from '../enum/transaction-association.enum';

import { BuyAssetTransactionCreateEntitySchema } from './buy-asset-transaction-create-entity.schema';

describe('BuyAssetTransactionCreateEntitySchema – invalid cases', () => {
    const fromAccountId = 11;
    const toAccountId = 22;
    const feeAccountId = 33;

    it('entries do not balance (beyond tolerance)', () => {
        const exchangeRate = 50_000.5;
        const toAmountMicro = 1_000_000;
        const feeMicro = 5_000_000;
        const convertedToInFromMicro = quoteMicroToBaseMicro(toAmountMicro, exchangeRate);
        const fromAmountMicro = convertedToInFromMicro + feeMicro - (TOLERANCE_MICRO + 5);

        const payload = createTransferTransactionInput({
            exchangeRate,
            toAccountId,
            fromAccountId,
            [TransactionAssociationEnum.ENTRIES]: [
                createTransferTransactionEntryInput(fromAccountId, TransactionEntryTypeEnum.CREDIT, fromAmountMicro),
                createTransferTransactionEntryInput(toAccountId, TransactionEntryTypeEnum.DEBIT, toAmountMicro),
                createTransferTransactionEntryInput(feeAccountId, TransactionEntryTypeEnum.DEBIT, feeMicro)
            ]
        });

        const result = BuyAssetTransactionCreateEntitySchema.safeParse(payload);

        expect(result.success).toBe(false);

        const error = isDefined(result.error) ? prettifyError(result.error) : '';

        expect(error).toContain('do not balance');
        expect(error).toContain(`at ${TransactionAssociationEnum.ENTRIES}`);
    });

    it('fromAccountId === toAccountId', () => {
        const payload = createTransferTransactionInput({
            exchangeRate: 2,
            toAccountId: fromAccountId,
            fromAccountId,
            [TransactionAssociationEnum.ENTRIES]: [
                createTransferTransactionEntryInput(fromAccountId, TransactionEntryTypeEnum.CREDIT, 100),
                createTransferTransactionEntryInput(fromAccountId, TransactionEntryTypeEnum.DEBIT, 100)
            ]
        });

        const result = BuyAssetTransactionCreateEntitySchema.safeParse(payload);
        expect(result.success).toBe(false);

        const error = isDefined(result.error) ? prettifyError(result.error) : '';

        expect(error).toContain('must be different');
        expect(error).toContain(`at ${TransactionAssociationEnum.ENTRIES}`);
    });

    it('exchangeRate === 1 (per your rule)', () => {
        const payload = createTransferTransactionInput({
            exchangeRate: 1,
            toAccountId,
            fromAccountId,
            [TransactionAssociationEnum.ENTRIES]: [
                createTransferTransactionEntryInput(fromAccountId, TransactionEntryTypeEnum.CREDIT, 100),
                createTransferTransactionEntryInput(toAccountId, TransactionEntryTypeEnum.DEBIT, 100)
            ]
        });

        const result = BuyAssetTransactionCreateEntitySchema.safeParse(payload);
        expect(result.success).toBe(false);

        const error = isDefined(result.error) ? prettifyError(result.error) : '';

        expect(error).toContain('must not be equal to 1');
        expect(error).toContain(`at exchangeRate`);
    });

    it('duplicate account ids in entries (uniqueness)', () => {
        const payload = createTransferTransactionInput({
            exchangeRate: 2,
            toAccountId,
            fromAccountId,
            [TransactionAssociationEnum.ENTRIES]: [
                createTransferTransactionEntryInput(fromAccountId, TransactionEntryTypeEnum.CREDIT, 100),
                createTransferTransactionEntryInput(toAccountId, TransactionEntryTypeEnum.DEBIT, 50),
                createTransferTransactionEntryInput(fromAccountId, TransactionEntryTypeEnum.DEBIT, 50)
            ]
        });

        const result = BuyAssetTransactionCreateEntitySchema.safeParse(payload);
        expect(result.success).toBe(false);

        const error = isDefined(result.error) ? prettifyError(result.error) : '';

        expect(error).toContain('each account may appear at most once');
        expect(error).toContain(`at ${TransactionAssociationEnum.ENTRIES}`);
    });

    it("wrong direction: from-entry must be 'credit'", () => {
        const exchangeRate = 2;
        const toAmountMicro = 1_000_000;
        const fromAmountMicro = quoteMicroToBaseMicro(toAmountMicro, exchangeRate);

        const payload = createTransferTransactionInput({
            exchangeRate,
            toAccountId,
            fromAccountId,
            [TransactionAssociationEnum.ENTRIES]: [
                createTransferTransactionEntryInput(fromAccountId, TransactionEntryTypeEnum.DEBIT, fromAmountMicro),
                createTransferTransactionEntryInput(toAccountId, TransactionEntryTypeEnum.DEBIT, toAmountMicro)
            ]
        });

        const result = BuyAssetTransactionCreateEntitySchema.safeParse(payload);
        expect(result.success).toBe(false);

        const error = isDefined(result.error) ? prettifyError(result.error) : '';

        expect(error).toContain('"from" entry must be "credit"');
        expect(error).toContain(`at ${TransactionAssociationEnum.ENTRIES}[0].type`);
    });

    it("wrong direction: to-entry must be 'debit'", () => {
        const exchangeRate = 2;
        const toAmountMicro = 1_000_000;
        const fromAmountMicro = quoteMicroToBaseMicro(toAmountMicro, exchangeRate);

        const payload = createTransferTransactionInput({
            exchangeRate,
            toAccountId,
            fromAccountId,
            [TransactionAssociationEnum.ENTRIES]: [
                createTransferTransactionEntryInput(fromAccountId, TransactionEntryTypeEnum.CREDIT, fromAmountMicro),
                createTransferTransactionEntryInput(toAccountId, TransactionEntryTypeEnum.CREDIT, toAmountMicro)
            ]
        });

        const result = BuyAssetTransactionCreateEntitySchema.safeParse(payload);
        expect(result.success).toBe(false);

        const error = isDefined(result.error) ? prettifyError(result.error) : '';

        expect(error).toContain('"to" entry must be "debit"');
        expect(error).toContain(`at ${TransactionAssociationEnum.ENTRIES}[1].type`);
    });

    it("fee entry must be 'debit' when present", () => {
        const exchangeRate = 2;
        const toAmountMicro = 1_000_000;
        const feeMicro = 10_000_000;
        const fromAmountMicro = quoteMicroToBaseMicro(toAmountMicro, exchangeRate) + feeMicro;

        const payload = createTransferTransactionInput({
            exchangeRate,
            toAccountId,
            fromAccountId,
            [TransactionAssociationEnum.ENTRIES]: [
                createTransferTransactionEntryInput(fromAccountId, TransactionEntryTypeEnum.CREDIT, fromAmountMicro),
                createTransferTransactionEntryInput(toAccountId, TransactionEntryTypeEnum.DEBIT, toAmountMicro),
                createTransferTransactionEntryInput(feeAccountId, TransactionEntryTypeEnum.CREDIT, feeMicro)
            ]
        });

        const result = BuyAssetTransactionCreateEntitySchema.safeParse(payload);

        expect(result.success).toBe(false);

        const error = isDefined(result.error) ? prettifyError(result.error) : '';

        expect(error).toContain('"fee" entry must be "debit"');
        expect(error).toContain(`at ${TransactionAssociationEnum.ENTRIES}[2].type`);
    });

    it('too few entries (min 2 enforced by base schema)', () => {
        const payload = createTransferTransactionInput({
            exchangeRate: 2,
            toAccountId,
            fromAccountId,
            [TransactionAssociationEnum.ENTRIES]: [createTransferTransactionEntryInput(fromAccountId, TransactionEntryTypeEnum.CREDIT, 100)]
        });

        const result = BuyAssetTransactionCreateEntitySchema.safeParse(payload);

        expect(result.success).toBe(false);

        const error = isDefined(result.error) ? prettifyError(result.error) : '';

        expect(error).toContain('Too small: expected array to have >=2');
        expect(error).toContain(`at ${TransactionAssociationEnum.ENTRIES}`);
    });

    it('too many entries (max 3 enforced by base schema)', () => {
        const mockAccountId = 44;

        const payload = createTransferTransactionInput({
            exchangeRate: 2,
            toAccountId,
            fromAccountId,
            [TransactionAssociationEnum.ENTRIES]: [
                createTransferTransactionEntryInput(fromAccountId, TransactionEntryTypeEnum.CREDIT, 100),
                createTransferTransactionEntryInput(toAccountId, TransactionEntryTypeEnum.DEBIT, 50),
                createTransferTransactionEntryInput(feeAccountId, TransactionEntryTypeEnum.DEBIT, 40),
                createTransferTransactionEntryInput(mockAccountId, TransactionEntryTypeEnum.DEBIT, 10)
            ]
        });

        const result = BuyAssetTransactionCreateEntitySchema.safeParse(payload);

        expect(result.success).toBe(false);

        const error = isDefined(result.error) ? prettifyError(result.error) : '';

        expect(error).toContain('Too big: expected array to have <=3 items');
        expect(error).toContain(`at ${TransactionAssociationEnum.ENTRIES}`);
    });
});
