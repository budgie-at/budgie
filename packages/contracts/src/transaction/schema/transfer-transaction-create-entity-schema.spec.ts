import { TransferTransactionCreateEntitySchema } from './transfer-transaction-create-entity.schema';

import { TransactionAssociationEnum } from '../enum/transaction-association.enum';
import { TransactionEntryTypeEnum } from '../../transaction-entry/enum/transaction-entry-type.enum';
import { PRECISION } from '../constant/precision.constant';
import { TOLERANCE_MICRO } from '../constant/tolerance-micro.constant';
import { createTransferTransactionEntryInput } from '../../test-utils/create-transfer-transaction-entry-input.util';
import { createTransferTransactionInput } from '../../test-utils/create-transfer-transaction-input.util';
import { getZodIssuePaths } from '../../test-utils/get-zod-paths.util';
import { getZodIssueMessages } from '../../test-utils/get-zod-messages.util';

const convertToFromMicro = (toAmountMicro: number, exchangeRate: number): number => {
    const rateScaledInteger = Math.round(exchangeRate * PRECISION);
    return Math.round((toAmountMicro * rateScaledInteger) / PRECISION);
};

describe('TransferTransactionCreateEntitySchema (Zod, end-to-end)', () => {
    const fromAccountId = 11;
    const toAccountId = 22;
    const feeAccountId = 33;

    it('valid — 2 entries, balances exactly in FROM currency', () => {
        const exchangeRate = 90_000.123456;
        const toAmountMicro = 1_000_000;
        const fromAmountMicro = convertToFromMicro(toAmountMicro, exchangeRate);

        const payload = createTransferTransactionInput({
            exchangeRate,
            fromAccountId,
            toAccountId,
            [TransactionAssociationEnum.ENTRIES]: [
                createTransferTransactionEntryInput(fromAccountId, TransactionEntryTypeEnum.CREDIT, fromAmountMicro),
                createTransferTransactionEntryInput(toAccountId, TransactionEntryTypeEnum.DEBIT, toAmountMicro)
            ]
        });

        const result = TransferTransactionCreateEntitySchema.safeParse(payload);
        expect(result.success).toBe(true);
    });

    it('valid — 3 entries with fee (DEBIT in FROM), balances exactly: from = converted(to) + fee', () => {
        const exchangeRate = 12_345.678901;
        const toAmountMicro = 2_500_000;
        const feeMicro = 30_000_000;
        const convertedToInFromMicro = convertToFromMicro(toAmountMicro, exchangeRate);
        const fromAmountMicro = convertedToInFromMicro + feeMicro;

        const payload = createTransferTransactionInput({
            exchangeRate,
            fromAccountId,
            toAccountId,
            [TransactionAssociationEnum.ENTRIES]: [
                createTransferTransactionEntryInput(fromAccountId, TransactionEntryTypeEnum.CREDIT, fromAmountMicro),
                createTransferTransactionEntryInput(toAccountId, TransactionEntryTypeEnum.DEBIT, toAmountMicro),
                createTransferTransactionEntryInput(feeAccountId, TransactionEntryTypeEnum.DEBIT, feeMicro)
            ]
        });

        const result = TransferTransactionCreateEntitySchema.safeParse(payload);
        expect(result.success).toBe(true);
    });

    it(`valid — within tolerance (±${TOLERANCE_MICRO} micro)`, () => {
        const exchangeRate = 7_777.777777;
        const toAmountMicro = 10_000_000;
        const feeMicro = 1_000_000;
        const convertedToInFromMicro = convertToFromMicro(toAmountMicro, exchangeRate);

        const fromAmountMicro = convertedToInFromMicro + feeMicro - TOLERANCE_MICRO;

        const payload = createTransferTransactionInput({
            exchangeRate,
            fromAccountId,
            toAccountId,
            [TransactionAssociationEnum.ENTRIES]: [
                createTransferTransactionEntryInput(fromAccountId, TransactionEntryTypeEnum.CREDIT, fromAmountMicro),
                createTransferTransactionEntryInput(toAccountId, TransactionEntryTypeEnum.DEBIT, toAmountMicro),
                createTransferTransactionEntryInput(feeAccountId, TransactionEntryTypeEnum.DEBIT, feeMicro)
            ]
        });

        const result = TransferTransactionCreateEntitySchema.safeParse(payload);
        expect(result.success).toBe(true);
    });

    it('invalid — entries do not balance (beyond tolerance)', () => {
        const exchangeRate = 50_000.5;
        const toAmountMicro = 1_000_000;
        const feeMicro = 5_000_000;
        const convertedToInFromMicro = convertToFromMicro(toAmountMicro, exchangeRate);
        const fromAmountMicro = convertedToInFromMicro + feeMicro - (TOLERANCE_MICRO + 5);

        const payload = createTransferTransactionInput({
            exchangeRate,
            fromAccountId,
            toAccountId,
            [TransactionAssociationEnum.ENTRIES]: [
                createTransferTransactionEntryInput(fromAccountId, TransactionEntryTypeEnum.CREDIT, fromAmountMicro),
                createTransferTransactionEntryInput(toAccountId, TransactionEntryTypeEnum.DEBIT, toAmountMicro),
                createTransferTransactionEntryInput(feeAccountId, TransactionEntryTypeEnum.DEBIT, feeMicro)
            ]
        });

        const result = TransferTransactionCreateEntitySchema.safeParse(payload);
        expect(result.success).toBe(false);
        expect(getZodIssueMessages(result).join(' ')).toContain('do not balance');
        expect(getZodIssuePaths(result)).toContainEqual([TransactionAssociationEnum.ENTRIES]);
    });

    it('invalid — fromAccountId === toAccountId', () => {
        const exchangeRate = 2;
        const toAmountMicro = 1_000;
        const fromAmountMicro = convertToFromMicro(toAmountMicro, exchangeRate);

        const payload = createTransferTransactionInput({
            exchangeRate,
            fromAccountId,
            toAccountId: fromAccountId,
            [TransactionAssociationEnum.ENTRIES]: [
                createTransferTransactionEntryInput(fromAccountId, TransactionEntryTypeEnum.CREDIT, fromAmountMicro),
                createTransferTransactionEntryInput(fromAccountId, TransactionEntryTypeEnum.DEBIT, toAmountMicro)
            ]
        });

        const result = TransferTransactionCreateEntitySchema.safeParse(payload);
        expect(result.success).toBe(false);
        expect(getZodIssueMessages(result).join(' ')).toContain('must be different');
        expect(getZodIssuePaths(result)).toContainEqual([TransactionAssociationEnum.ENTRIES]);
    });

    it('invalid — duplicate account ids in entries', () => {
        const exchangeRate = 2;

        const payload = createTransferTransactionInput({
            exchangeRate,
            fromAccountId,
            toAccountId,
            [TransactionAssociationEnum.ENTRIES]: [
                createTransferTransactionEntryInput(fromAccountId, TransactionEntryTypeEnum.CREDIT, 100),
                createTransferTransactionEntryInput(toAccountId, TransactionEntryTypeEnum.DEBIT, 50),
                createTransferTransactionEntryInput(fromAccountId, TransactionEntryTypeEnum.DEBIT, 50)
            ]
        });

        const result = TransferTransactionCreateEntitySchema.safeParse(payload);
        expect(result.success).toBe(false);
        expect(getZodIssueMessages(result).join(' ')).toContain('each account may appear at most once');
        expect(getZodIssuePaths(result)).toContainEqual([TransactionAssociationEnum.ENTRIES]);
    });

    it("invalid — wrong direction: from-entry must be 'credit'", () => {
        const exchangeRate = 2;
        const toAmountMicro = 1_000_000;
        const fromAmountMicro = convertToFromMicro(toAmountMicro, exchangeRate);

        const payload = createTransferTransactionInput({
            exchangeRate,
            fromAccountId,
            toAccountId,
            [TransactionAssociationEnum.ENTRIES]: [
                createTransferTransactionEntryInput(fromAccountId, TransactionEntryTypeEnum.DEBIT, fromAmountMicro),
                createTransferTransactionEntryInput(toAccountId, TransactionEntryTypeEnum.DEBIT, toAmountMicro)
            ]
        });

        const result = TransferTransactionCreateEntitySchema.safeParse(payload);
        expect(result.success).toBe(false);
        expect(getZodIssueMessages(result).join(' ')).toContain("from-entry must be 'credit'");
        expect(getZodIssuePaths(result)).toContainEqual([TransactionAssociationEnum.ENTRIES, 0, 'type']);
    });

    it("invalid — wrong direction: to-entry must be 'debit'", () => {
        const exchangeRate = 2;
        const toAmountMicro = 1_000_000;
        const fromAmountMicro = convertToFromMicro(toAmountMicro, exchangeRate);

        const payload = createTransferTransactionInput({
            exchangeRate,
            fromAccountId,
            toAccountId,
            [TransactionAssociationEnum.ENTRIES]: [
                createTransferTransactionEntryInput(fromAccountId, TransactionEntryTypeEnum.CREDIT, fromAmountMicro),
                createTransferTransactionEntryInput(toAccountId, TransactionEntryTypeEnum.CREDIT, toAmountMicro)
            ]
        });

        const result = TransferTransactionCreateEntitySchema.safeParse(payload);
        expect(result.success).toBe(false);
        expect(getZodIssueMessages(result).join(' ')).toContain("to-entry must be 'debit'");
        expect(getZodIssuePaths(result)).toContainEqual([TransactionAssociationEnum.ENTRIES, 1, 'type']);
    });

    it("invalid — fee entry must be 'debit' when present", () => {
        const exchangeRate = 2;
        const toAmountMicro = 1_000_000;
        const feeMicro = 10_000_000;
        const fromAmountMicro = convertToFromMicro(toAmountMicro, exchangeRate) + feeMicro;

        const payload = createTransferTransactionInput({
            exchangeRate,
            fromAccountId,
            toAccountId,
            [TransactionAssociationEnum.ENTRIES]: [
                createTransferTransactionEntryInput(fromAccountId, TransactionEntryTypeEnum.CREDIT, fromAmountMicro),
                createTransferTransactionEntryInput(toAccountId, TransactionEntryTypeEnum.DEBIT, toAmountMicro),
                createTransferTransactionEntryInput(feeAccountId, TransactionEntryTypeEnum.CREDIT, feeMicro)
            ]
        });

        const result = TransferTransactionCreateEntitySchema.safeParse(payload);
        expect(result.success).toBe(false);
        expect(getZodIssueMessages(result).join(' ')).toContain("fee-entry must be 'debit'");
        expect(getZodIssuePaths(result)).toContainEqual([TransactionAssociationEnum.ENTRIES, 2, 'type']);
    });

    it('invalid — too few entries (min 2)', () => {
        const exchangeRate = 2;

        const payload = createTransferTransactionInput({
            exchangeRate,
            fromAccountId,
            toAccountId,
            [TransactionAssociationEnum.ENTRIES]: [createTransferTransactionEntryInput(fromAccountId, TransactionEntryTypeEnum.CREDIT, 100)]
        });

        const result = TransferTransactionCreateEntitySchema.safeParse(payload);
        expect(result.success).toBe(false);
        expect(getZodIssueMessages(result).join(' ')).toContain('Too small: expected array to have >=2 items');
        expect(getZodIssuePaths(result)).toContainEqual([TransactionAssociationEnum.ENTRIES]);
    });

    it('invalid — too many entries (max 3)', () => {
        const exchangeRate = 2;

        const payload = createTransferTransactionInput({
            exchangeRate,
            fromAccountId,
            toAccountId,
            [TransactionAssociationEnum.ENTRIES]: [
                createTransferTransactionEntryInput(fromAccountId, TransactionEntryTypeEnum.CREDIT, 100),
                createTransferTransactionEntryInput(toAccountId, TransactionEntryTypeEnum.DEBIT, 50),
                createTransferTransactionEntryInput(feeAccountId, TransactionEntryTypeEnum.DEBIT, 40),
                createTransferTransactionEntryInput(44, TransactionEntryTypeEnum.DEBIT, 10)
            ]
        });

        const result = TransferTransactionCreateEntitySchema.safeParse(payload);
        expect(result.success).toBe(false);
        expect(getZodIssueMessages(result).join(' ')).toContain('Too big: expected array to have <=3 items');
        expect(getZodIssuePaths(result)).toContainEqual([TransactionAssociationEnum.ENTRIES]);
    });
});
