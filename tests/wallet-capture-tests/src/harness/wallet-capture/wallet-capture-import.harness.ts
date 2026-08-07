import { ruleEngineService } from '@app/rule/service/rule-engine.service';
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
import { eq } from 'drizzle-orm';
import { expect, vi } from 'vitest';

import { isDefined } from '@rnw-community/shared';

import { testDb } from '../scenario/setup';
import { seed } from '../seed/seed';

import type { WalletCaptureNativeRecordInterface } from '@app/wallet-capture/interface/wallet-capture-native-record.interface';

export const WALLET_CAPTURE_AMOUNT = 125;
export const WALLET_CAPTURE_AMOUNT_IN_MICRO_UNITS = WALLET_CAPTURE_AMOUNT * PRECISION;
export const WALLET_CAPTURE_MISSING_ACCOUNT_ID = 999;

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

export const walletCaptureFindTransaction = (externalId: string) =>
    testDb.select().from(TransactionEntityTable).where(eq(TransactionEntityTable.externalId, externalId)).all()[0];

export const walletCaptureFindEntry = (transactionId: number) =>
    testDb.select().from(TransactionEntryEntityTable).where(eq(TransactionEntryEntityTable.transactionId, transactionId)).all()[0];

const walletCaptureFindTransactionTag = (transactionId: number) =>
    testDb.select().from(TransactionTagsEntityTable).where(eq(TransactionTagsEntityTable.transactionId, transactionId)).all()[0];

export const walletCaptureSeedRule = (): { readonly id: number; readonly tagId: number } => {
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

    testDb
        .insert(RuleConditionEntityTable)
        .values([
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
        ])
        .run();
    testDb
        .insert(RuleActionEntityTable)
        .values({ ruleId: rule.id, type: RuleActionTypeEnum.SET_CATEGORY, categoryId: category.id, tagId: null, accountId: null })
        .run();
    testDb
        .insert(RuleActionEntityTable)
        .values({ ruleId: rule.id, type: RuleActionTypeEnum.ADD_TAG, categoryId: null, tagId: tag.id, accountId: null })
        .run();

    return { id: category.id, tagId: tag.id };
};

export const walletCaptureSeedInput = (captureId: string) => {
    seed.instrument();
    const account = seed.account({ title: 'Wallet card' });
    const category = walletCaptureSeedRule();
    const capture = walletCaptureBuild(captureId, { accountId: account.id });

    return { capture, category };
};

export const walletCaptureForcePostCreateRulePreparation = (): void => {
    vi.spyOn(ruleEngineService, 'prepareCreateInputsForRules').mockImplementation(async transactionInputs => ({
        transactionInputs,
        postCreateIndexes: [0]
    }));
};

export const walletCaptureSeedExistingTransaction = (capture: WalletCaptureNativeRecordInterface): void => {
    seed.bankPairExpense(
        { externalId: capture.captureId, operatedAt: new Date(capture.capturedAt) },
        { accountId: capture.accountId, amount: WALLET_CAPTURE_AMOUNT_IN_MICRO_UNITS, mccCategoryId: null }
    );
    seed.updateTransaction(1, {
        externalSource: ExternalSourceEnum.APPLE_PAY_AUTOMATION,
        title: capture.merchant
    });
};

export const walletCaptureExpectRuleApplied = (
    capture: WalletCaptureNativeRecordInterface,
    category: { readonly id: number; readonly tagId: number }
): void => {
    const transaction = walletCaptureFindTransaction(capture.captureId);
    const entry = walletCaptureFindEntry(transaction.id);
    const transactionTag = walletCaptureFindTransactionTag(transaction.id);

    expect(entry).toMatchObject({
        type: TransactionEntryTypeEnum.CREDIT,
        amount: WALLET_CAPTURE_AMOUNT_IN_MICRO_UNITS,
        categoryId: category.id,
        categorySource: CategorySourceEnum.RULE
    });
    expect(transactionTag.tagId).toBe(category.tagId);
};
