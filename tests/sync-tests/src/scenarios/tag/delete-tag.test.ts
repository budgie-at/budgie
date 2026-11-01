import { TagService } from '@app/tag/service/tag.service';
import { TagRepository, TransactionEntityTable, TransactionTagsEntityTable } from '@budgie/contracts';
import { describe, expect, it } from '@effect/vitest';
import { eq } from 'drizzle-orm';
import * as Effect from 'effect/Effect';

import { seed, testDb, TestLayer } from '../../harness';

describe('tag/delete-tag', () => {
    it.effect('removes the tag and its links while keeping the transactions', () =>
        Effect.gen(function* () {
            const tagService = yield* TagService;
            const tagRepository = yield* TagRepository;
            const account = yield* seed.account({ title: 'Card' });
            const tag = yield* seed.tag('Trip');
            const expense = yield* seed.manualExpense({ accountId: account.id, amount: 5_000_000, operatedAt: new Date(), title: 'Hotel' });
            yield* seed.transactionTag(expense.id, tag.id);

            yield* tagService.deleteById(tag.id);

            expect(yield* tagRepository.findByIds([tag.id])).toHaveLength(0);
            expect(
                yield* testDb.select().from(TransactionTagsEntityTable).where(eq(TransactionTagsEntityTable.tagId, tag.id))
            ).toHaveLength(0);
            expect(yield* testDb.select().from(TransactionEntityTable).where(eq(TransactionEntityTable.id, expense.id))).toHaveLength(1);
        }).pipe(Effect.provide(TestLayer))
    );

    it.effect('skips a generated translation when the title changed meanwhile', () =>
        Effect.gen(function* () {
            const tagRepository = yield* TagRepository;
            const tag = yield* seed.tag('Trip');
            yield* tagRepository.updateById(tag.id, { title: 'Travel' });

            yield* tagRepository.updateTranslationForTitle(tag.id, 'Trip', 'trip', 'journey');

            const [saved] = yield* tagRepository.findByIds([tag.id]);
            expect(saved).toMatchObject({ title: 'Travel', titleEn: null, titleTags: null });
        }).pipe(Effect.provide(TestLayer))
    );
});
