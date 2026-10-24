import {
    CategoryEntityTable,
    CategorySourceEnum,
    MccCategoryEntityTable,
    ExternalSourceEnum,
    RuleActionEntityTable,
    RuleActionTypeEnum,
    TagEntityTable,
    TagSourceEnum,
    TransactionEntryEntityTable,
    TransactionTagsEntityTable
} from '@budgie/contracts';
import { describe, expect, it } from '@effect/vitest';
import { eq } from 'drizzle-orm';
import * as Effect from 'effect/Effect';

import { makeStubFileBankSyncService, testDb, TestLayer } from '../../harness';
import {
    PRIVATBANK_CARD_ID,
    PRIVATBANK_STATEMENT_URI,
    StubPrivatbankFileClient,
    buildPrivatbankRow,
    seedPrivatbankAccount
} from '../../harness/file-sync/privatbank-statement-fixture';
import { seedTitleRule } from '../../harness/seed/seed-title-rule';

describe('privatbank/rules-on-import', () => {
    it.effect('persists the matching rule category and tag over the bank default category when inserting imported transactions', () =>
        Effect.gen(function* () {
            const [defaultCategory, ruleCategory] = yield* testDb.select().from(CategoryEntityTable).limit(2);
            const [mccCategory] = yield* testDb.select().from(MccCategoryEntityTable).limit(1);
            const [tag] = yield* testDb
                .insert(TagEntityTable)
                .values({ title: 'Utilities', titleSearch: 'utilities', titleEn: null, titleTags: null, tagsGeneratedAt: null })
                .returning();
            const rule = yield* seedTitleRule('TRANZZO', {
                type: RuleActionTypeEnum.SET_CATEGORY,
                categoryId: ruleCategory.id,
                accountId: null
            });

            yield* testDb
                .insert(RuleActionEntityTable)
                .values({ ruleId: rule.id, type: RuleActionTypeEnum.ADD_TAG, categoryId: null, tagId: tag.id, accountId: null });
            yield* seedPrivatbankAccount();

            const client = new StubPrivatbankFileClient();
            const syncService = yield* makeStubFileBankSyncService(
                ExternalSourceEnum.PRIVATBANK,
                client,
                new Map([[buildPrivatbankRow().category, { id: mccCategory.id, defaultCategoryId: defaultCategory.id }]])
            );
            const [importedTransaction] = client.getTransactions(PRIVATBANK_CARD_ID);

            yield* syncService.executeImportForSelectedAccounts(PRIVATBANK_STATEMENT_URI, [PRIVATBANK_CARD_ID]);

            const [entry] = yield* testDb
                .select()
                .from(TransactionEntryEntityTable)
                .where(eq(TransactionEntryEntityTable.externalId, importedTransaction.id));
            const [transactionTag] = yield* testDb
                .select()
                .from(TransactionTagsEntityTable)
                .where(eq(TransactionTagsEntityTable.transactionId, entry.transactionId));

            expect(entry.categoryId).toBe(ruleCategory.id);
            expect(entry.categorySource).toBe(CategorySourceEnum.RULE);
            expect(transactionTag.tagId).toBe(tag.id);
            expect(transactionTag.source).toBe(TagSourceEnum.RULE);
        }).pipe(Effect.provide(TestLayer))
    );
});
