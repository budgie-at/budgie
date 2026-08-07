import { transactionRepository } from '@app/@generic/drizzle/db/db';
import { WalletCaptureReviewReasonEnum } from '@app/wallet-capture/enum/wallet-capture-review-reason.enum';
import { WalletCaptureStatusEnum } from '@app/wallet-capture/enum/wallet-capture-status.enum';
import { walletCaptureImportService } from '@app/wallet-capture/service/wallet-capture-import.service';
import {
    AccountBalanceEntityTable,
    CategoryEntityTable,
    CategorySourceEnum,
    ExternalSourceEnum,
    PRECISION,
    RuleActionEntityTable,
    RuleActionTypeEnum,
    RuleConditionEntityTable,
    RuleConditionFieldEnum,
    RuleConditionMatchTypeEnum,
    RuleConditionOperatorEnum,
    RuleEntityTable,
    TransactionEntityTable,
    TransactionEntryEntityTable,
    TransactionEntryTypeEnum,
    TransactionTagsEntityTable,
    TransactionTypeEnum,
    UserIconNameEnum
} from '@budgie/contracts';
import { eq } from 'drizzle-orm';
import { describe, expect, it, vi } from 'vitest';

import { isDefined } from '@rnw-community/shared';

import { walletCaptureNativeStub } from '../../harness/native/wallet-capture-native.stub';
import { testDb } from '../../harness/scenario/setup';
import { seed } from '../../harness/seed/seed';

import type { WalletCaptureNativeRecordInterface } from '@app/wallet-capture/interface/wallet-capture-native-record.interface';

const CAPTURE_AMOUNT = 125;
const CAPTURE_AMOUNT_IN_MICRO_UNITS = CAPTURE_AMOUNT * PRECISION;
const CAPTURE_ID = '8e3f58ae-cd1c-45c8-91da-e54a5c8ea111';
const SAFE_CAPTURE_ID = '8e3f58ae-cd1c-45c8-91da-e54a5c8ea222';
const FAILING_CAPTURE_ID = '8e3f58ae-cd1c-45c8-91da-e54a5c8ea333';
const REVIEW_DUPLICATE_TRANSACTION_ID = 77;
const MISSING_ACCOUNT_ID = 999;

const buildCapture = (overrides: Partial<WalletCaptureNativeRecordInterface> = {}): WalletCaptureNativeRecordInterface => ({
    captureId: CAPTURE_ID,
    accountId: 1,
    amount: CAPTURE_AMOUNT,
    merchant: 'Silpo',
    cardName: 'Mono Black',
    capturedAt: '2026-08-07T10:00:00.000Z',
    status: WalletCaptureStatusEnum.PENDING,
    duplicateTransactionId: null,
    ...overrides
});

const buildWalletRuleConditions = (ruleId: number) => [
    {
        ruleId,
        field: RuleConditionFieldEnum.TITLE,
        operator: RuleConditionOperatorEnum.CONTAINS,
        value: 'Silpo',
        secondaryValue: null
    },
    {
        ruleId,
        field: RuleConditionFieldEnum.EXTERNAL_SOURCE,
        operator: RuleConditionOperatorEnum.EQUALS,
        value: ExternalSourceEnum.APPLE_PAY_AUTOMATION,
        secondaryValue: null
    }
];

const buildWalletRuleActions = (ruleId: number, categoryId: number, tagId: number) => [
    { ruleId, type: RuleActionTypeEnum.SET_CATEGORY, categoryId, tagId: null, accountId: null },
    { ruleId, type: RuleActionTypeEnum.ADD_TAG, categoryId: null, tagId, accountId: null }
];
const seedWalletCaptureRule = (): { readonly id: number; readonly tagId: number } => {
    const tag = seed.tag('Food');
    const [category] = testDb
        .insert(CategoryEntityTable)
        .values({
            title: 'Groceries',
            titleSearch: 'groceries',
            titleEn: null,
            titleTags: null,
            tagsGeneratedAt: null,
            icon: UserIconNameEnum.ShoppingBasket,
            parentId: null,
            isDefault: false,
            isSystemCategory: false
        })
        .returning()
        .all();
    const [rule] = testDb
        .insert(RuleEntityTable)
        .values({ enabled: true, conditionMatchType: RuleConditionMatchTypeEnum.ALL })
        .returning()
        .all();

    if (!isDefined(category) || !isDefined(rule)) {
        throw new Error('Failed to seed Wallet capture rule');
    }

    testDb.insert(RuleConditionEntityTable).values(buildWalletRuleConditions(rule.id)).run();
    testDb
        .insert(RuleActionEntityTable)
        .values(buildWalletRuleActions(rule.id, category.id, tag.id))
        .run();

    return { id: category.id, tagId: tag.id };
};
const findTransaction = (externalId: string) =>
    testDb.select().from(TransactionEntityTable).where(eq(TransactionEntityTable.externalId, externalId)).all()[0];

const expectImportedBalanceAndTag = (capture: WalletCaptureNativeRecordInterface, transactionId: number, tagId: number): void => {
    const [balance] = testDb
        .select()
        .from(AccountBalanceEntityTable)
        .where(eq(AccountBalanceEntityTable.accountId, capture.accountId))
        .all();
    const [transactionTag] = testDb
        .select()
        .from(TransactionTagsEntityTable)
        .where(eq(TransactionTagsEntityTable.transactionId, transactionId))
        .all();

    expect(balance.amount).toBe(-CAPTURE_AMOUNT_IN_MICRO_UNITS);
    expect(transactionTag.tagId).toBe(tagId);
};

const expectImportedTransaction = (capture: WalletCaptureNativeRecordInterface): number => {
    const transaction = findTransaction(capture.captureId);
    expect(transaction.externalSource).toBe(ExternalSourceEnum.APPLE_PAY_AUTOMATION);
    expect(transaction.externalId).toBe(capture.captureId);
    expect(transaction.title).toBe('Silpo');
    expect(transaction.type).toBe(TransactionTypeEnum.EXPENSE);
    expect(transaction.fromAccountId).toBe(capture.accountId);

    return transaction.id;
};

const expectImportedCapture = (
    capture: WalletCaptureNativeRecordInterface,
    category: { readonly id: number; readonly tagId: number }
): void => {
    const transactionId = expectImportedTransaction(capture);
    const [entry] = testDb
        .select()
        .from(TransactionEntryEntityTable)
        .where(eq(TransactionEntryEntityTable.transactionId, transactionId))
        .all();

    expect(entry.type).toBe(TransactionEntryTypeEnum.CREDIT);
    expect(entry.amount).toBe(CAPTURE_AMOUNT_IN_MICRO_UNITS);
    expect(entry.categoryId).toBe(category.id);
    expect(entry.categorySource).toBe(CategorySourceEnum.RULE);
    expect(entry.externalId).toBe(capture.captureId);
    expectImportedBalanceAndTag(capture, transactionId, category.tagId);
};

describe('Wallet capture import creation', () => {
    it('creates an expense, applies matching rules, and acknowledges the capture', async () => {
        seed.instrument();
        const account = seed.account({ title: 'Wallet card' });
        const category = seedWalletCaptureRule();
        const capture = buildCapture({ accountId: account.id });

        walletCaptureNativeStub.seed([capture]);

        await expect(walletCaptureImportService.drain()).resolves.toEqual([]);

        expectImportedCapture(capture, category);
        await expect(walletCaptureNativeStub.getCaptures()).resolves.toEqual([]);
    });

    it('acknowledges an already imported capture UUID without creating another transaction', async () => {
        seed.instrument();
        const account = seed.account({ title: 'Wallet card' });
        const capture = buildCapture({ accountId: account.id });

        seed.bankPairExpense(
            { externalId: capture.captureId, operatedAt: new Date(capture.capturedAt) },
            { accountId: account.id, amount: CAPTURE_AMOUNT_IN_MICRO_UNITS, mccCategoryId: null }
        );
        seed.updateTransaction(1, {
            externalSource: ExternalSourceEnum.APPLE_PAY_AUTOMATION,
            title: capture.merchant
        });
        walletCaptureNativeStub.seed([capture]);

        await expect(walletCaptureImportService.drain()).resolves.toEqual([]);

        expect(testDb.select().from(TransactionEntityTable).all()).toHaveLength(1);
        await expect(walletCaptureNativeStub.getCaptures()).resolves.toEqual([]);
    });

    it('keeps a capture pending when transaction creation fails', async () => {
        seed.instrument();
        const account = seed.account({ title: 'Wallet card' });
        const safeCapture = buildCapture({ accountId: account.id, captureId: SAFE_CAPTURE_ID });
        const failingCapture = buildCapture({ accountId: account.id, captureId: FAILING_CAPTURE_ID });

        walletCaptureNativeStub.seed([failingCapture, safeCapture]);
        vi.spyOn(transactionRepository, 'bulkCreate').mockRejectedValueOnce(new Error('database unavailable'));

        await expect(walletCaptureImportService.drain()).resolves.toEqual([]);

        expect(findTransaction(safeCapture.captureId).externalId).toBe(safeCapture.captureId);
        await expect(walletCaptureNativeStub.getCaptures()).resolves.toEqual([failingCapture]);
    });
});

describe('Wallet capture import review', () => {
    it('marks a nearby semantic duplicate for review without creating it', async () => {
        seed.instrument();
        const account = seed.account({ title: 'Wallet card' });
        const capture = buildCapture({ accountId: account.id });
        const existingTransaction = seed.bankPairExpense(
            { externalId: 'existing-wallet-candidate', operatedAt: new Date('2026-08-07T10:01:30.000Z') },
            { accountId: account.id, amount: CAPTURE_AMOUNT_IN_MICRO_UNITS, mccCategoryId: null }
        );

        seed.updateTransaction(existingTransaction.id, {
            externalSource: ExternalSourceEnum.APPLE_PAY_AUTOMATION,
            title: ' silpo '
        });
        walletCaptureNativeStub.seed([capture]);

        await expect(walletCaptureImportService.drain()).resolves.toEqual([
            { capture, duplicateTransactionId: existingTransaction.id, reason: WalletCaptureReviewReasonEnum.DUPLICATE }
        ]);

        expect(testDb.select().from(TransactionEntityTable).all()).toHaveLength(1);
        await expect(walletCaptureNativeStub.getCaptures()).resolves.toEqual([
            { ...capture, status: WalletCaptureStatusEnum.NEEDS_REVIEW, duplicateTransactionId: existingTransaction.id }
        ]);
    });

    it('imports a reviewed duplicate when forceImport is called', async () => {
        seed.instrument();
        const account = seed.account({ title: 'Wallet card' });
        const capture = buildCapture({
            accountId: account.id,
            status: WalletCaptureStatusEnum.NEEDS_REVIEW,
            duplicateTransactionId: REVIEW_DUPLICATE_TRANSACTION_ID
        });

        walletCaptureNativeStub.seed([capture]);

        await expect(walletCaptureImportService.forceImport(capture.captureId)).resolves.toBeUndefined();

        expect(findTransaction(capture.captureId).externalSource).toBe(ExternalSourceEnum.APPLE_PAY_AUTOMATION);
        await expect(walletCaptureNativeStub.getCaptures()).resolves.toEqual([]);
    });

    it('dismisses a reviewed duplicate without creating it', async () => {
        seed.instrument();
        const account = seed.account({ title: 'Wallet card' });
        const capture = buildCapture({
            accountId: account.id,
            status: WalletCaptureStatusEnum.NEEDS_REVIEW,
            duplicateTransactionId: REVIEW_DUPLICATE_TRANSACTION_ID
        });

        walletCaptureNativeStub.seed([capture]);

        await expect(walletCaptureImportService.dismiss(capture.captureId)).resolves.toBeUndefined();

        expect(testDb.select().from(TransactionEntityTable).all()).toHaveLength(0);
        await expect(walletCaptureNativeStub.getCaptures()).resolves.toEqual([]);
    });
});

describe('Wallet capture import preservation', () => {
    it('keeps a capture pending when its account no longer exists', async () => {
        seed.instrument();
        const capture = buildCapture({ accountId: MISSING_ACCOUNT_ID });

        walletCaptureNativeStub.seed([capture]);

        await expect(walletCaptureImportService.drain()).resolves.toEqual([
            { capture, duplicateTransactionId: null, reason: WalletCaptureReviewReasonEnum.ACCOUNT_UNAVAILABLE }
        ]);

        expect(testDb.select().from(TransactionEntityTable).all()).toHaveLength(0);
        await expect(walletCaptureNativeStub.getCaptures()).resolves.toEqual([capture]);
    });

    it('reports invalid native payloads without acknowledging inbox data', async () => {
        seed.instrument();
        const account = seed.account({ title: 'Wallet card' });
        const capture = buildCapture({ accountId: account.id });
        const invalidCapture = { ...capture, amount: -CAPTURE_AMOUNT };

        walletCaptureNativeStub.seed([invalidCapture]);

        await expect(walletCaptureImportService.drain()).rejects.toThrow();
        await expect(walletCaptureNativeStub.getCaptures()).resolves.toEqual([invalidCapture]);
    });
});
