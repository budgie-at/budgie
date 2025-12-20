import { describe, expect, it } from '@jest/globals';
import { prettifyError } from 'zod';

import { isDefined } from '@rnw-community/shared';

import { convertToMicroUnits } from '../../@generic/util/convert-to-micto-units.util';
import { createTransferTransactionEntryInput } from '../../test-utils/create-transfer-transaction-entry-input.util';
import { createTransferTransactionInput } from '../../test-utils/create-transfer-transaction-input.util';
import { TransactionEntryTypeEnum } from '../../transaction-entry/enum/transaction-entry-type.enum';
import { TOLERANCE_MICRO } from '../constant/tolerance-micro.constant';
import { TransactionAssociationEnum } from '../enum/transaction-association.enum';

import { TransferTransactionCreateEntitySchema } from './transfer-transaction-create-entity.schema';

describe('TransferTransactionCreateEntitySchema – invalid cases', () => {
    const fromAccountId = 11;
    const toAccountId = 22;
    const feeAccountId = 33;

    const ONE_SCALED = convertToMicroUnits(1);

    it('entries do not balance (beyond tolerance)', () => {
        const conversionRate = convertToMicroUnits(42.26);
        const toAmount = convertToMicroUnits(2450.75);
        const fee = convertToMicroUnits(18.5);

        const converted = (toAmount * conversionRate) / ONE_SCALED;
        const fromAmount = converted + fee - (BigInt(TOLERANCE_MICRO) + 5n);

        const payload = createTransferTransactionInput({
            amount: fromAmount,
            exchangeRate: conversionRate,
            fromAccountId,
            toAccountId,
            [TransactionAssociationEnum.ENTRIES]: [
                createTransferTransactionEntryInput(fromAccountId, TransactionEntryTypeEnum.CREDIT, fromAmount),
                createTransferTransactionEntryInput(toAccountId, TransactionEntryTypeEnum.DEBIT, toAmount),
                createTransferTransactionEntryInput(feeAccountId, TransactionEntryTypeEnum.DEBIT, fee)
            ]
        });

        const result = TransferTransactionCreateEntitySchema.safeParse(payload);
        expect(result.success).toBe(false);

        const error = isDefined(result.error) ? prettifyError(result.error) : '';

        expect(error).toContain('do not balance');
        expect(error).toContain(`at ${TransactionAssociationEnum.ENTRIES}`);
    });

    it('fromAccountId === toAccountId', () => {
        const conversionRate = convertToMicroUnits(1.17);
        const toAmount = convertToMicroUnits(1500.0);

        const fromAmount = (toAmount * conversionRate) / ONE_SCALED;

        const payload = createTransferTransactionInput({
            amount: fromAmount,
            exchangeRate: conversionRate,
            fromAccountId,
            toAccountId: fromAccountId,
            [TransactionAssociationEnum.ENTRIES]: [
                createTransferTransactionEntryInput(fromAccountId, TransactionEntryTypeEnum.CREDIT, fromAmount),
                createTransferTransactionEntryInput(fromAccountId, TransactionEntryTypeEnum.DEBIT, toAmount)
            ]
        });

        const result = TransferTransactionCreateEntitySchema.safeParse(payload);
        expect(result.success).toBe(false);

        const error = isDefined(result.error) ? prettifyError(result.error) : '';

        expect(error).toContain('must be different');
        expect(error).toContain(`at ${TransactionAssociationEnum.ENTRIES}`);
    });

    it('duplicate account ids in entries', () => {
        const conversionRate = convertToMicroUnits(156.07);
        const toAmount = convertToMicroUnits(2000.0);

        const fromAmount = (toAmount * conversionRate) / ONE_SCALED;

        const payload = createTransferTransactionInput({
            amount: fromAmount,
            exchangeRate: conversionRate,
            fromAccountId,
            toAccountId,
            [TransactionAssociationEnum.ENTRIES]: [
                createTransferTransactionEntryInput(fromAccountId, TransactionEntryTypeEnum.CREDIT, fromAmount),
                createTransferTransactionEntryInput(toAccountId, TransactionEntryTypeEnum.DEBIT, toAmount),
                createTransferTransactionEntryInput(fromAccountId, TransactionEntryTypeEnum.DEBIT, convertToMicroUnits(50.0))
            ]
        });

        const result = TransferTransactionCreateEntitySchema.safeParse(payload);
        expect(result.success).toBe(false);

        const error = isDefined(result.error) ? prettifyError(result.error) : '';

        expect(error).toContain('each account may appear at most once');
        expect(error).toContain(`at ${TransactionAssociationEnum.ENTRIES}`);
    });

    it("wrong direction: from-entry must be 'credit'", () => {
        const conversionRate = convertToMicroUnits(1.34);
        const toAmount = convertToMicroUnits(890.0);

        const fromAmount = (toAmount * conversionRate) / ONE_SCALED;

        const payload = createTransferTransactionInput({
            amount: fromAmount,
            exchangeRate: conversionRate,
            fromAccountId,
            toAccountId,
            [TransactionAssociationEnum.ENTRIES]: [
                createTransferTransactionEntryInput(fromAccountId, TransactionEntryTypeEnum.DEBIT, fromAmount),
                createTransferTransactionEntryInput(toAccountId, TransactionEntryTypeEnum.DEBIT, toAmount)
            ]
        });

        const result = TransferTransactionCreateEntitySchema.safeParse(payload);
        expect(result.success).toBe(false);

        const error = isDefined(result.error) ? prettifyError(result.error) : '';

        expect(error).toContain('"from" entry must be "credit"');
        expect(error).toContain(`at ${TransactionAssociationEnum.ENTRIES}[0].type`);
    });

    it("wrong direction: to-entry must be 'debit'", () => {
        const conversionRate = convertToMicroUnits(0.8);
        const toAmount = convertToMicroUnits(1275.0);

        const fromAmount = (toAmount * conversionRate) / ONE_SCALED;

        const payload = createTransferTransactionInput({
            amount: fromAmount,
            exchangeRate: conversionRate,
            fromAccountId,
            toAccountId,
            [TransactionAssociationEnum.ENTRIES]: [
                createTransferTransactionEntryInput(fromAccountId, TransactionEntryTypeEnum.CREDIT, fromAmount),
                createTransferTransactionEntryInput(toAccountId, TransactionEntryTypeEnum.CREDIT, toAmount)
            ]
        });

        const result = TransferTransactionCreateEntitySchema.safeParse(payload);
        expect(result.success).toBe(false);

        const error = isDefined(result.error) ? prettifyError(result.error) : '';

        expect(error).toContain('"to" entry must be "debit"');
        expect(error).toContain(`at ${TransactionAssociationEnum.ENTRIES}[1].type`);
    });

    it("fee entry must be 'debit' when present", () => {
        const conversionRate = convertToMicroUnits(42.26);
        const toAmount = convertToMicroUnits(1200.0);
        const fee = convertToMicroUnits(15.0);

        const fromAmount = (toAmount * conversionRate) / ONE_SCALED + fee;

        const payload = createTransferTransactionInput({
            amount: fromAmount,
            exchangeRate: conversionRate,
            fromAccountId,
            toAccountId,
            [TransactionAssociationEnum.ENTRIES]: [
                createTransferTransactionEntryInput(fromAccountId, TransactionEntryTypeEnum.CREDIT, fromAmount),
                createTransferTransactionEntryInput(toAccountId, TransactionEntryTypeEnum.DEBIT, toAmount),
                createTransferTransactionEntryInput(feeAccountId, TransactionEntryTypeEnum.CREDIT, fee)
            ]
        });

        const result = TransferTransactionCreateEntitySchema.safeParse(payload);
        expect(result.success).toBe(false);

        const error = isDefined(result.error) ? prettifyError(result.error) : '';

        expect(error).toContain('"fee" entry must be "debit"');
        expect(error).toContain(`at ${TransactionAssociationEnum.ENTRIES}[2].type`);
    });

    it('too few entries (min 2)', () => {
        const conversionRate = convertToMicroUnits(1.17);
        const toAmount = convertToMicroUnits(500.0);

        const fromAmount = (toAmount * conversionRate) / ONE_SCALED;

        const payload = createTransferTransactionInput({
            amount: fromAmount,
            exchangeRate: conversionRate,
            fromAccountId,
            toAccountId,
            [TransactionAssociationEnum.ENTRIES]: [
                createTransferTransactionEntryInput(fromAccountId, TransactionEntryTypeEnum.CREDIT, fromAmount)
            ]
        });

        const result = TransferTransactionCreateEntitySchema.safeParse(payload);
        expect(result.success).toBe(false);

        const error = isDefined(result.error) ? prettifyError(result.error) : '';

        expect(error).toContain('Too small: expected array to have >=2');
        expect(error).toContain(`at ${TransactionAssociationEnum.ENTRIES}`);
    });

    it('too many entries (max 3)', () => {
        const conversionRate = convertToMicroUnits(156.07);
        const toAmount = convertToMicroUnits(800.0);

        const fromAmount = (toAmount * conversionRate) / ONE_SCALED;

        const payload = createTransferTransactionInput({
            amount: fromAmount,
            exchangeRate: conversionRate,
            fromAccountId,
            toAccountId,
            [TransactionAssociationEnum.ENTRIES]: [
                createTransferTransactionEntryInput(fromAccountId, TransactionEntryTypeEnum.CREDIT, fromAmount),
                createTransferTransactionEntryInput(toAccountId, TransactionEntryTypeEnum.DEBIT, toAmount),
                createTransferTransactionEntryInput(feeAccountId, TransactionEntryTypeEnum.DEBIT, convertToMicroUnits(10.0)),
                createTransferTransactionEntryInput(44, TransactionEntryTypeEnum.DEBIT, convertToMicroUnits(5.0))
            ]
        });

        const result = TransferTransactionCreateEntitySchema.safeParse(payload);
        expect(result.success).toBe(false);

        const error = isDefined(result.error) ? prettifyError(result.error) : '';

        expect(error).toContain('Too big: expected array to have <=3 items');
        expect(error).toContain(`at ${TransactionAssociationEnum.ENTRIES}`);
    });
});
