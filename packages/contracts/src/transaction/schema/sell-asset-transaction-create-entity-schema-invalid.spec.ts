import { convertFromToMicro } from '../../test-utils/convert-from-to-micro.util';
import { createTransferTransactionEntryInput } from '../../test-utils/create-transfer-transaction-entry-input.util';
import { createTransferTransactionInput } from '../../test-utils/create-transfer-transaction-input.util';
import { getZodIssueMessages } from '../../test-utils/get-zod-messages.util';
import { getZodIssuePaths } from '../../test-utils/get-zod-paths.util';
import { TransactionEntryTypeEnum } from '../../transaction-entry/enum/transaction-entry-type.enum';
import { TOLERANCE_MICRO } from '../constant/tolerance-micro.constant';
import { TransactionAssociationEnum } from '../enum/transaction-association.enum';

import { SellAssetTransactionCreateEntitySchema } from './sell-asset-transaction-create-entity.schema';

describe('SellAssetTransactionCreateEntitySchema (Zod, end-to-end)', () => {
    const fromAccountId = 11;
    const toAccountId = 22;
    const feeAccountId = 33;

    it('entries do not balance (beyond tolerance)', () => {
        const exchangeRate = 50_000.5;
        const fromAmountMicro = 1_000_000;
        const convertedFromToMicro = convertFromToMicro(fromAmountMicro, exchangeRate);
        const feeMicro = Math.max(1, Math.floor(convertedFromToMicro / 5));

        const toAmountMicro = convertedFromToMicro - feeMicro + (TOLERANCE_MICRO + 5);

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

        const result = SellAssetTransactionCreateEntitySchema.safeParse(payload);
        expect(result.success).toBe(false);
        expect(getZodIssueMessages(result).join(' ')).toContain('do not balance');
        expect(getZodIssuePaths(result)).toContainEqual([TransactionAssociationEnum.ENTRIES]);
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

        const result = SellAssetTransactionCreateEntitySchema.safeParse(payload);
        expect(result.success).toBe(false);
        expect(getZodIssueMessages(result).join(' ')).toContain('must be different');
        expect(getZodIssuePaths(result)).toContainEqual([TransactionAssociationEnum.ENTRIES]);
    });

    it('exchangeRate === 1 (per rule)', () => {
        const payload = createTransferTransactionInput({
            exchangeRate: 1,
            toAccountId,
            fromAccountId,
            [TransactionAssociationEnum.ENTRIES]: [
                createTransferTransactionEntryInput(fromAccountId, TransactionEntryTypeEnum.CREDIT, 100),
                createTransferTransactionEntryInput(toAccountId, TransactionEntryTypeEnum.DEBIT, 100)
            ]
        });

        const result = SellAssetTransactionCreateEntitySchema.safeParse(payload);
        expect(result.success).toBe(false);
        expect(getZodIssueMessages(result).join(' ')).toContain('must not be equal to 1');
        expect(getZodIssuePaths(result)).toContainEqual(['exchangeRate']);
    });

    it('duplicate account ids in entries', () => {
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

        const result = SellAssetTransactionCreateEntitySchema.safeParse(payload);
        expect(result.success).toBe(false);
        expect(getZodIssueMessages(result).join(' ')).toContain('each account may appear at most once');
        expect(getZodIssuePaths(result)).toContainEqual([TransactionAssociationEnum.ENTRIES]);
    });

    it("wrong direction: from-entry must be 'credit'", () => {
        const exchangeRate = 2;
        const fromAmountMicro = 1_000_000;
        const toAmountMicro = convertFromToMicro(fromAmountMicro, exchangeRate);

        const payload = createTransferTransactionInput({
            exchangeRate,
            toAccountId,
            fromAccountId,
            [TransactionAssociationEnum.ENTRIES]: [
                createTransferTransactionEntryInput(fromAccountId, TransactionEntryTypeEnum.DEBIT, fromAmountMicro),
                createTransferTransactionEntryInput(toAccountId, TransactionEntryTypeEnum.DEBIT, toAmountMicro)
            ]
        });

        const result = SellAssetTransactionCreateEntitySchema.safeParse(payload);
        expect(result.success).toBe(false);
        expect(getZodIssueMessages(result).join(' ')).toContain('"from" entry must be "credit"');
        expect(getZodIssuePaths(result)).toContainEqual([TransactionAssociationEnum.ENTRIES, 0, 'type']);
    });

    it("wrong direction: to-entry must be 'debit'", () => {
        const exchangeRate = 2;
        const fromAmountMicro = 1_000_000;
        const toAmountMicro = convertFromToMicro(fromAmountMicro, exchangeRate);

        const payload = createTransferTransactionInput({
            exchangeRate,
            toAccountId,
            fromAccountId,
            [TransactionAssociationEnum.ENTRIES]: [
                createTransferTransactionEntryInput(fromAccountId, TransactionEntryTypeEnum.CREDIT, fromAmountMicro),
                createTransferTransactionEntryInput(toAccountId, TransactionEntryTypeEnum.CREDIT, toAmountMicro)
            ]
        });

        const result = SellAssetTransactionCreateEntitySchema.safeParse(payload);
        expect(result.success).toBe(false);
        expect(getZodIssueMessages(result).join(' ')).toContain('"to" entry must be "debit"');
        expect(getZodIssuePaths(result)).toContainEqual([TransactionAssociationEnum.ENTRIES, 1, 'type']);
    });

    it("fee entry must be 'debit' when present", () => {
        const exchangeRate = 2;
        const fromAmountMicro = 1_000_000;
        const convertedFromToMicro = convertFromToMicro(fromAmountMicro, exchangeRate);
        const feeMicro = Math.max(1, Math.floor(convertedFromToMicro / 10));
        const toAmountMicro = convertedFromToMicro - feeMicro;

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

        const result = SellAssetTransactionCreateEntitySchema.safeParse(payload);
        expect(result.success).toBe(false);
        expect(getZodIssueMessages(result).join(' ')).toContain('"fee" entry must be "debit"');
        expect(getZodIssuePaths(result)).toContainEqual([TransactionAssociationEnum.ENTRIES, 2, 'type']);
    });

    it('too few entries (min 2)', () => {
        const payload = createTransferTransactionInput({
            exchangeRate: 2,
            toAccountId,
            fromAccountId,
            [TransactionAssociationEnum.ENTRIES]: [createTransferTransactionEntryInput(fromAccountId, TransactionEntryTypeEnum.CREDIT, 100)]
        });

        const result = SellAssetTransactionCreateEntitySchema.safeParse(payload);
        expect(result.success).toBe(false);
        expect(getZodIssueMessages(result).join(' ')).toContain('Too small: expected array to have >=2 items');
        expect(getZodIssuePaths(result)).toContainEqual([TransactionAssociationEnum.ENTRIES]);
    });

    it('too many entries (max 3)', () => {
        const payload = createTransferTransactionInput({
            exchangeRate: 2,
            toAccountId,
            fromAccountId,
            [TransactionAssociationEnum.ENTRIES]: [
                createTransferTransactionEntryInput(fromAccountId, TransactionEntryTypeEnum.CREDIT, 100),
                createTransferTransactionEntryInput(toAccountId, TransactionEntryTypeEnum.DEBIT, 50),
                createTransferTransactionEntryInput(feeAccountId, TransactionEntryTypeEnum.DEBIT, 40),
                createTransferTransactionEntryInput(44, TransactionEntryTypeEnum.DEBIT, 10)
            ]
        });

        const result = SellAssetTransactionCreateEntitySchema.safeParse(payload);
        expect(result.success).toBe(false);
        expect(getZodIssueMessages(result).join(' ')).toContain('Too big: expected array to have <=3 items');
        expect(getZodIssuePaths(result)).toContainEqual([TransactionAssociationEnum.ENTRIES]);
    });
});
