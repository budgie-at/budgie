import { ruleEngineService } from '@app/rule/service/rule-engine.service';
import { WalletCaptureReviewReasonEnum } from '@app/wallet-capture/enum/wallet-capture-review-reason.enum';
import { WalletCaptureStatusEnum } from '@app/wallet-capture/enum/wallet-capture-status.enum';
import { walletCaptureImportService } from '@app/wallet-capture/service/wallet-capture-import.service';
import {
    AccountEntityTable,
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
const CAPTURE_ID = '8e3f58ae-cd1c-45c8-91da-e54a5c8ea444';
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

const findEntry = (transactionId: number) =>
    testDb.select().from(TransactionEntryEntityTable).where(eq(TransactionEntryEntityTable.transactionId, transactionId)).all()[0];

const findTransactionTag = (transactionId: number) =>
    testDb.select().from(TransactionTagsEntityTable).where(eq(TransactionTagsEntityTable.transactionId, transactionId)).all()[0];

const seedWalletCaptureInput = (): {
    readonly capture: WalletCaptureNativeRecordInterface;
    readonly category: { readonly id: number; readonly tagId: number };
} => {
    seed.instrument();
    const account = seed.account({ title: 'Wallet card' });
    const category = seedWalletCaptureRule();
    const capture = buildCapture({ accountId: account.id });

    return { capture, category };
};

const forcePostCreateRulePreparation = (): void => {
    vi.spyOn(ruleEngineService, 'prepareCreateInputsForRules').mockImplementation(async transactionInputs => ({
        transactionInputs,
        postCreateIndexes: [0]
    }));
};

const seedExistingWalletTransaction = (capture: WalletCaptureNativeRecordInterface): void => {
    seed.bankPairExpense(
        { externalId: capture.captureId, operatedAt: new Date(capture.capturedAt) },
        { accountId: capture.accountId, amount: CAPTURE_AMOUNT_IN_MICRO_UNITS, mccCategoryId: null }
    );
    seed.updateTransaction(1, {
        externalSource: ExternalSourceEnum.APPLE_PAY_AUTOMATION,
        title: capture.merchant
    });
};

const expectCreatedCapturePending = (capture: WalletCaptureNativeRecordInterface): void => {
    const transaction = findTransaction(capture.captureId);

    expect(transaction.externalSource).toBe(ExternalSourceEnum.APPLE_PAY_AUTOMATION);
    expect(findEntry(transaction.id).categorySource).toBe(CategorySourceEnum.USER);
};

const expectRuleApplied = (
    capture: WalletCaptureNativeRecordInterface,
    category: { readonly id: number; readonly tagId: number }
): void => {
    const transaction = findTransaction(capture.captureId);
    const entry = findEntry(transaction.id);
    const transactionTag = findTransactionTag(transaction.id);

    expect(entry.type).toBe(TransactionEntryTypeEnum.CREDIT);
    expect(entry.amount).toBe(CAPTURE_AMOUNT_IN_MICRO_UNITS);
    expect(entry.categoryId).toBe(category.id);
    expect(entry.categorySource).toBe(CategorySourceEnum.RULE);
    expect(transactionTag.tagId).toBe(category.tagId);
};

describe('Wallet capture import regressions', () => {
    it('retries post-create rule application for an exact existing capture before acknowledging it', async () => {
        const { capture, category } = seedWalletCaptureInput();

        walletCaptureNativeStub.seed([capture]);
        forcePostCreateRulePreparation();
        vi.spyOn(ruleEngineService, 'applyRulesToTransactions').mockRejectedValueOnce(new Error('rules unavailable'));

        await expect(walletCaptureImportService.drain()).resolves.toEqual([]);

        expectCreatedCapturePending(capture);
        await expect(walletCaptureNativeStub.getCaptures()).resolves.toEqual([capture]);

        await expect(walletCaptureImportService.drain()).resolves.toEqual([]);

        expect(testDb.select().from(TransactionEntityTable).all()).toHaveLength(1);
        expectRuleApplied(capture, category);
        await expect(walletCaptureNativeStub.getCaptures()).resolves.toEqual([]);
    });

    it('returns and dismisses a pending capture whose account is missing from review items', async () => {
        seed.instrument();
        const capture = buildCapture({ accountId: MISSING_ACCOUNT_ID });

        walletCaptureNativeStub.seed([capture]);

        await expect(walletCaptureImportService.getReviewItems()).resolves.toEqual([
            { capture, duplicateTransactionId: null, reason: WalletCaptureReviewReasonEnum.ACCOUNT_UNAVAILABLE }
        ]);
        await expect(walletCaptureImportService.dismiss(capture.captureId)).resolves.toBeUndefined();
        await expect(walletCaptureNativeStub.getCaptures()).resolves.toEqual([]);
    });

    it('returns and dismisses a pending capture whose account is inactive from review items', async () => {
        seed.instrument();
        const account = seed.account({ title: 'Wallet card' });
        const capture = buildCapture({ accountId: account.id });

        testDb.update(AccountEntityTable).set({ isActive: false }).where(eq(AccountEntityTable.id, account.id)).run();
        walletCaptureNativeStub.seed([capture]);

        await expect(walletCaptureImportService.getReviewItems()).resolves.toEqual([
            { capture, duplicateTransactionId: null, reason: WalletCaptureReviewReasonEnum.ACCOUNT_UNAVAILABLE }
        ]);
        await expect(walletCaptureImportService.dismiss(capture.captureId)).resolves.toBeUndefined();
        await expect(walletCaptureNativeStub.getCaptures()).resolves.toEqual([]);
    });

    it('does not dismiss an arbitrary pending capture with an available account', async () => {
        seed.instrument();
        const account = seed.account({ title: 'Wallet card' });
        const capture = buildCapture({ accountId: account.id });

        walletCaptureNativeStub.seed([capture]);

        await expect(walletCaptureImportService.dismiss(capture.captureId)).resolves.toBeUndefined();
        await expect(walletCaptureNativeStub.getCaptures()).resolves.toEqual([capture]);
    });

    it('force-imports an already-created reviewed capture without duplicating it', async () => {
        const input = seedWalletCaptureInput();
        const capture = buildCapture({
            accountId: input.capture.accountId,
            status: WalletCaptureStatusEnum.NEEDS_REVIEW,
            duplicateTransactionId: MISSING_ACCOUNT_ID
        });

        seedExistingWalletTransaction(capture);
        walletCaptureNativeStub.seed([capture]);
        forcePostCreateRulePreparation();

        await expect(walletCaptureImportService.forceImport(capture.captureId)).resolves.toBeUndefined();

        expect(testDb.select().from(TransactionEntityTable).all()).toHaveLength(1);
        expectRuleApplied(capture, input.category);
        await expect(walletCaptureNativeStub.getCaptures()).resolves.toEqual([]);
    });
});
