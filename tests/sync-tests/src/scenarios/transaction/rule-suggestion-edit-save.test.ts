import {
    CategorySourceEnum,
    ExternalSourceEnum,
    LanguageEnum,
    TransactionUpdatedByEnum,
    TransactionViewRepository,
    convertToMicroUnits
} from '@budgie/contracts';
import { TransactionService } from '@budgie/ledger';
import { RuleEngineService, RuleService } from '@budgie/rules';
import { describe, expect, it } from '@effect/vitest';
import * as Effect from 'effect/Effect';

import { isDefined } from '@rnw-community/shared';

import { convertTransactionToInput } from '../../../../../packages/app/src/transaction/utils/convert-transaction-to-input.util';
import { seed, TestLayer } from '../../harness';

const title = 'Fixture bank merchant and payment reference '.repeat(4);

const readTransaction = (id: number) =>
    Effect.flatMap(TransactionViewRepository, repository => repository.getById(id, LanguageEnum.EN)).pipe(
        Effect.filterOrElse(isDefined, () => Effect.die(new Error('Fixture transaction missing')))
    );

describe('transaction/rule-suggestion-edit-save', () => {
    it.effect('commits both matching rule updates and saves the current edit without changing money or truncating the bank title', () =>
        Effect.gen(function* () {
            const ruleService = yield* RuleService;
            const ruleEngineService = yield* RuleEngineService;
            const transactionService = yield* TransactionService;
            const account = yield* seed.account();
            const category = yield* seed.category('Fixture rule category');
            const tag = yield* seed.tag('Fixture rule tag');
            const transactions = yield* Effect.forEach([10, 20], amount =>
                seed.manualExpense({
                    accountId: account.id,
                    amount: convertToMicroUnits(amount),
                    operatedAt: new Date('2026-09-29T12:00:00Z'),
                    externalSource: ExternalSourceEnum.ENABLE_BANKING,
                    title
                })
            );
            const rule = yield* ruleService.createFromSuggestion({
                title,
                comment: '',
                mccCode: null,
                categoryId: category.id,
                tagIds: [tag.id]
            });

            expect(yield* ruleEngineService.applyRuleToMatchingTransactions(rule.id)).toEqual({ applied: 2, failed: 0, total: 2 });

            for (const { id } of transactions) {
                const updated = yield* readTransaction(id);

                expect(updated.updatedBy).toBe(TransactionUpdatedByEnum.RULE);
                expect(updated.entries[0]).toMatchObject({ categoryId: category.id, categorySource: CategorySourceEnum.RULE });
                expect(updated.transactionTags.map(transactionTag => transactionTag.tagId)).toEqual([tag.id]);
            }

            const current = yield* readTransaction(transactions[0].id);
            yield* transactionService.updateById(current.id, convertTransactionToInput(current));
            const saved = yield* readTransaction(current.id);

            expect(saved.title).toBe(title);
            expect(saved.updatedBy).toBe(TransactionUpdatedByEnum.USER);
            expect(saved.entries[0]).toMatchObject({ categoryId: category.id, amount: convertToMicroUnits(10) });
            expect(saved.transactionTags.map(transactionTag => transactionTag.tagId)).toEqual([tag.id]);
        }).pipe(Effect.provide(TestLayer))
    );
});
