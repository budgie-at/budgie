import { convertToFromMicro } from '../../test-utils/convert-to-from-micro.util';
import { createEntryInput } from '../../test-utils/create-transaction-entry-input.util';
import { createTransactionInput } from '../../test-utils/create-transaction-input.util';
import { getZodIssueMessages } from '../../test-utils/get-zod-messages.util';
import { getZodIssuePaths } from '../../test-utils/get-zod-paths.util';
import { TransactionEntryTypeEnum } from '../../transaction-entry/enum/transaction-entry-type.enum';
import { TOLERANCE_MICRO } from '../constant/tolerance-micro.constant';
import { TransactionAssociationEnum } from '../enum/transaction-association.enum';

import { BuyAssetTransactionCreateEntitySchema } from './buy-asset-transaction-create-entity.schema';

describe('BuyAssetTransactionCreateEntitySchema (Zod, end-to-end)', () => {
    const fromAccountId = 11;
    const toAccountId = 22;
    const feeAccountId = 33;

    it('entries do not balance (beyond tolerance)', () => {
        const exchangeRate = 50_000.5;
        const toAmountMicro = 1_000_000;
        const feeMicro = 5_000_000;
        const convertedToInFromMicro = convertToFromMicro(toAmountMicro, exchangeRate);
        const fromAmountMicro = convertedToInFromMicro + feeMicro - (TOLERANCE_MICRO + 5);

        const payload = createTransactionInput({
            exchangeRate,
            toAccountId,
            fromAccountId,
            [TransactionAssociationEnum.ENTRIES]: [
                createEntryInput(fromAccountId, TransactionEntryTypeEnum.CREDIT, fromAmountMicro),
                createEntryInput(toAccountId, TransactionEntryTypeEnum.DEBIT, toAmountMicro),
                createEntryInput(feeAccountId, TransactionEntryTypeEnum.DEBIT, feeMicro)
            ]
        });

        const result = BuyAssetTransactionCreateEntitySchema.safeParse(payload);

        expect(result.success).toBe(false);
        expect(getZodIssueMessages(result).join(' ')).toContain('do not balance');
        expect(getZodIssuePaths(result)).toContainEqual([TransactionAssociationEnum.ENTRIES]);
    });

    it('fromAccountId === toAccountId', () => {
        const payload = createTransactionInput({
            exchangeRate: 2,
            toAccountId: fromAccountId,
            fromAccountId,
            [TransactionAssociationEnum.ENTRIES]: [
                createEntryInput(fromAccountId, TransactionEntryTypeEnum.CREDIT, 100),
                createEntryInput(fromAccountId, TransactionEntryTypeEnum.DEBIT, 100)
            ]
        });

        const result = BuyAssetTransactionCreateEntitySchema.safeParse(payload);
        expect(result.success).toBe(false);
        expect(getZodIssueMessages(result).join(' ')).toContain('must be different');
        expect(getZodIssuePaths(result)).toContainEqual([TransactionAssociationEnum.ENTRIES]);
    });

    it('exchangeRate === 1 (per your rule)', () => {
        const payload = createTransactionInput({
            exchangeRate: 1,
            toAccountId,
            fromAccountId,
            [TransactionAssociationEnum.ENTRIES]: [
                createEntryInput(fromAccountId, TransactionEntryTypeEnum.CREDIT, 100),
                createEntryInput(toAccountId, TransactionEntryTypeEnum.DEBIT, 100)
            ]
        });

        const result = BuyAssetTransactionCreateEntitySchema.safeParse(payload);
        expect(result.success).toBe(false);
        expect(getZodIssueMessages(result).join(' ')).toContain('must not be equal to 1');
        expect(getZodIssuePaths(result)).toContainEqual(['exchangeRate']);
    });

    it('duplicate account ids in entries (uniqueness)', () => {
        const payload = createTransactionInput({
            exchangeRate: 2,
            toAccountId,
            fromAccountId,
            [TransactionAssociationEnum.ENTRIES]: [
                createEntryInput(fromAccountId, TransactionEntryTypeEnum.CREDIT, 100),
                createEntryInput(toAccountId, TransactionEntryTypeEnum.DEBIT, 50),
                createEntryInput(fromAccountId, TransactionEntryTypeEnum.DEBIT, 50)
            ]
        });

        const result = BuyAssetTransactionCreateEntitySchema.safeParse(payload);
        expect(result.success).toBe(false);
        expect(getZodIssueMessages(result).join(' ')).toContain('each account may appear at most once');
        expect(getZodIssuePaths(result)).toContainEqual([TransactionAssociationEnum.ENTRIES]);
    });

    it("wrong direction: from-entry must be 'credit'", () => {
        const exchangeRate = 2;
        const toAmountMicro = 1_000_000;
        const fromAmountMicro = convertToFromMicro(toAmountMicro, exchangeRate);

        const payload = createTransactionInput({
            exchangeRate,
            toAccountId,
            fromAccountId,
            [TransactionAssociationEnum.ENTRIES]: [
                createEntryInput(fromAccountId, TransactionEntryTypeEnum.DEBIT, fromAmountMicro),
                createEntryInput(toAccountId, TransactionEntryTypeEnum.DEBIT, toAmountMicro)
            ]
        });

        const result = BuyAssetTransactionCreateEntitySchema.safeParse(payload);
        expect(result.success).toBe(false);
        expect(getZodIssueMessages(result).join(' ')).toContain("from-entry must be 'credit'");
        expect(getZodIssuePaths(result)).toContainEqual([TransactionAssociationEnum.ENTRIES, 0, 'type']);
    });

    it("wrong direction: to-entry must be 'debit'", () => {
        const exchangeRate = 2;
        const toAmountMicro = 1_000_000;
        const fromAmountMicro = convertToFromMicro(toAmountMicro, exchangeRate);

        const payload = createTransactionInput({
            exchangeRate,
            toAccountId,
            fromAccountId,
            [TransactionAssociationEnum.ENTRIES]: [
                createEntryInput(fromAccountId, TransactionEntryTypeEnum.CREDIT, fromAmountMicro),
                createEntryInput(toAccountId, TransactionEntryTypeEnum.CREDIT, toAmountMicro)
            ]
        });

        const result = BuyAssetTransactionCreateEntitySchema.safeParse(payload);
        expect(result.success).toBe(false);
        expect(getZodIssueMessages(result).join(' ')).toContain("to-entry must be 'debit'");
        expect(getZodIssuePaths(result)).toContainEqual([TransactionAssociationEnum.ENTRIES, 1, 'type']);
    });

    it("fee entry must be 'debit' when present", () => {
        const exchangeRate = 2;
        const toAmountMicro = 1_000_000;
        const feeMicro = 10_000_000;
        const fromAmountMicro = convertToFromMicro(toAmountMicro, exchangeRate) + feeMicro;

        const payload = createTransactionInput({
            exchangeRate,
            toAccountId,
            fromAccountId,
            [TransactionAssociationEnum.ENTRIES]: [
                createEntryInput(fromAccountId, TransactionEntryTypeEnum.CREDIT, fromAmountMicro),
                createEntryInput(toAccountId, TransactionEntryTypeEnum.DEBIT, toAmountMicro),
                createEntryInput(feeAccountId, TransactionEntryTypeEnum.CREDIT, feeMicro)
            ]
        });

        const result = BuyAssetTransactionCreateEntitySchema.safeParse(payload);

        expect(result.success).toBe(false);
        expect(getZodIssueMessages(result).join(' ')).toContain("fee-entry must be 'debit'");
        expect(getZodIssuePaths(result)).toContainEqual([TransactionAssociationEnum.ENTRIES, 2, 'type']);
    });

    it('too few entries (min 2 enforced by base schema)', () => {
        const payload = createTransactionInput({
            exchangeRate: 2,
            toAccountId,
            fromAccountId,
            [TransactionAssociationEnum.ENTRIES]: [createEntryInput(fromAccountId, TransactionEntryTypeEnum.CREDIT, 100)]
        });

        const result = BuyAssetTransactionCreateEntitySchema.safeParse(payload);

        expect(result.success).toBe(false);
        expect(getZodIssueMessages(result).join(' ')).toEqual(
            'Too small: expected array to have >=2 items entries must include exactly one from-account "entry" and one to-account "entry"'
        );
        expect(getZodIssuePaths(result)).toContainEqual([TransactionAssociationEnum.ENTRIES]);
    });

    it('too many entries (max 3 enforced by base schema)', () => {
        const mockAccountId = 44;

        const payload = createTransactionInput({
            exchangeRate: 2,
            toAccountId,
            fromAccountId,
            [TransactionAssociationEnum.ENTRIES]: [
                createEntryInput(fromAccountId, TransactionEntryTypeEnum.CREDIT, 100),
                createEntryInput(toAccountId, TransactionEntryTypeEnum.DEBIT, 50),
                createEntryInput(feeAccountId, TransactionEntryTypeEnum.DEBIT, 40),
                createEntryInput(mockAccountId, TransactionEntryTypeEnum.DEBIT, 10)
            ]
        });

        const result = BuyAssetTransactionCreateEntitySchema.safeParse(payload);

        expect(result.success).toBe(false);
        expect(getZodIssueMessages(result).join(' ')).toEqual(
            'Too big: expected array to have <=3 items entries do not balance (micro): total signed FROM = 50 (must be 0±1)'
        );
        expect(getZodIssuePaths(result)).toContainEqual([TransactionAssociationEnum.ENTRIES]);
    });
});
