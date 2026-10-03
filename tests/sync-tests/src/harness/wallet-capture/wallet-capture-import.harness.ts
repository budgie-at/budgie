import { WalletCaptureStatusEnum } from '@app/wallet-capture/enum/wallet-capture-status.enum';
import {
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
import { RuleEngineService } from '@budgie/rules';
import { eq } from 'drizzle-orm';
import * as Effect from 'effect/Effect';
import { expect, vi } from 'vitest';

import { isDefined } from '@rnw-community/shared';

import { testDb } from '../scenario/setup';
import { seed } from '../seed/seed';

import type { WalletCaptureNativeRecordInterface } from '@app/wallet-capture/interface/wallet-capture-native-record.interface';

export const WALLET_CAPTURE_AMOUNT = 125;
export const WALLET_CAPTURE_AMOUNT_IN_MICRO_UNITS = WALLET_CAPTURE_AMOUNT * PRECISION;
export const WALLET_CAPTURE_MISSING_ACCOUNT_ID = 999;

export const walletCaptureSeedAccount = Effect.fnUntraced(function* () {
    yield* seed.instrument();

    return yield* seed.account({ title: 'Wallet card' });
});

export const walletCaptureBuild = (
    captureId: string,
    overrides: Partial<WalletCaptureNativeRecordInterface> = {}
): WalletCaptureNativeRecordInterface => ({
    captureId,
    accountId: 1,
    amount: WALLET_CAPTURE_AMOUNT,
    merchant: 'Silpo',
    cardName: 'Mono Black',
    capturedAt: '2026-08-07T10:00:00.000Z',
    status: WalletCaptureStatusEnum.PENDING,
    duplicateTransactionId: null,
    ...overrides
});

export const walletCaptureFindTransaction = Effect.fnUntraced(function* (externalId: string) {
    const [transaction] = yield* testDb.select().from(TransactionEntityTable).where(eq(TransactionEntityTable.externalId, externalId));

    return transaction;
});

export const walletCaptureFindEntry = Effect.fnUntraced(function* (transactionId: number) {
    const [entry] = yield* testDb
        .select()
        .from(TransactionEntryEntityTable)
        .where(eq(TransactionEntryEntityTable.transactionId, transactionId));

    return entry;
});

const walletCaptureFindTransactionTag = Effect.fnUntraced(function* (transactionId: number) {
    const [transactionTag] = yield* testDb
        .select()
        .from(TransactionTagsEntityTable)
        .where(eq(TransactionTagsEntityTable.transactionId, transactionId));

    return transactionTag;
});

export const walletCaptureSeedRule = Effect.fnUntraced(function* () {
    const tag = yield* seed.tag('Food');
    const [category] = yield* testDb
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
        .returning();
    const [rule] = yield* testDb
        .insert(RuleEntityTable)
        .values({ enabled: true, conditionMatchType: RuleConditionMatchTypeEnum.ALL })
        .returning();

    if (!isDefined(category) || !isDefined(rule)) {
        return yield* Effect.die(new Error('Failed to seed Wallet capture rule'));
    }

    yield* testDb.insert(RuleConditionEntityTable).values([
        {
            ruleId: rule.id,
            field: RuleConditionFieldEnum.TITLE,
            operator: RuleConditionOperatorEnum.CONTAINS,
            value: 'Silpo',
            secondaryValue: null
        },
        {
            ruleId: rule.id,
            field: RuleConditionFieldEnum.EXTERNAL_SOURCE,
            operator: RuleConditionOperatorEnum.EQUALS,
            value: ExternalSourceEnum.APPLE_PAY_AUTOMATION,
            secondaryValue: null
        }
    ]);
    yield* testDb
        .insert(RuleActionEntityTable)
        .values({ ruleId: rule.id, type: RuleActionTypeEnum.SET_CATEGORY, categoryId: category.id, tagId: null, accountId: null });
    yield* testDb
        .insert(RuleActionEntityTable)
        .values({ ruleId: rule.id, type: RuleActionTypeEnum.ADD_TAG, categoryId: null, tagId: tag.id, accountId: null });

    return { id: category.id, tagId: tag.id };
});

export const walletCaptureSeedInput = Effect.fnUntraced(function* (captureId: string) {
    yield* seed.instrument();
    const account = yield* seed.account({ title: 'Wallet card' });
    const category = yield* walletCaptureSeedRule();
    const capture = walletCaptureBuild(captureId, { accountId: account.id });

    return { capture, category };
});

export const walletCaptureForcePostCreateRulePreparation = (ruleEngineService: RuleEngineService['Service']): void => {
    vi.spyOn(ruleEngineService, 'prepareCreateInputsForRules').mockImplementation(transactionInputs =>
        Effect.succeed({
            transactionInputs,
            postCreateIndexes: [0]
        })
    );
};

export const walletCaptureSeedExistingTransaction = Effect.fnUntraced(function* (capture: WalletCaptureNativeRecordInterface) {
    yield* seed.bankPairExpense(
        { externalId: capture.captureId, operatedAt: new Date(capture.capturedAt) },
        { accountId: capture.accountId, amount: WALLET_CAPTURE_AMOUNT_IN_MICRO_UNITS, mccCategoryId: null }
    );
    yield* seed.updateTransaction(1, {
        externalSource: ExternalSourceEnum.APPLE_PAY_AUTOMATION,
        title: capture.merchant
    });
});

export const walletCaptureExpectRuleApplied = Effect.fnUntraced(function* (
    capture: WalletCaptureNativeRecordInterface,
    category: { readonly id: number; readonly tagId: number }
) {
    const transaction = yield* walletCaptureFindTransaction(capture.captureId);
    const entry = yield* walletCaptureFindEntry(transaction.id);
    const transactionTag = yield* walletCaptureFindTransactionTag(transaction.id);

    expect(entry).toMatchObject({
        type: TransactionEntryTypeEnum.CREDIT,
        amount: WALLET_CAPTURE_AMOUNT_IN_MICRO_UNITS,
        categoryId: category.id,
        categorySource: CategorySourceEnum.RULE
    });
    expect(transactionTag.tagId).toBe(category.tagId);
});
