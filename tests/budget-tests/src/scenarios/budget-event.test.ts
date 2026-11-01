import { BudgetPeriodCloseService, BudgetPeriodSnapshotRepository, BudgetRepository, computeSpent } from '@budgie/budget';
import { AccountTypeEnum, BudgetKindEnum } from '@budgie/contracts';
import { expect, layer } from '@effect/vitest';
import * as Effect from 'effect/Effect';

import { createTestBudget, seedCategorizedExpense, TestLayer, testSeedService, units } from '../harness';

const EVENT_STARTS_AT = new Date(2026, 5, 10);
const EVENT_ENDS_AT = new Date(2026, 5, 14);
const EVENT_WINDOW_END = new Date(2026, 5, 15);

const seedTripExpenses = Effect.fnUntraced(function* () {
    const category = yield* testSeedService.category('Travel');
    const tag = yield* testSeedService.tag('Trip');
    const account = yield* testSeedService.account({ type: AccountTypeEnum.BANK_SYNC, instrumentId: 1 });
    const expense = Effect.fnUntraced(function* (operatedAt: Date, amount: number, externalId: string, isTagged: boolean) {
        const transaction = yield* seedCategorizedExpense({
            accountId: account.id,
            categoryId: category.id,
            operatedAt,
            amount: units(amount),
            externalId
        });

        if (isTagged) {
            yield* testSeedService.transactionTag(transaction.id, tag.id);
        }
    });

    yield* expense(new Date(2026, 5, 11, 12), 100, 'tagged-inside', true);
    yield* expense(new Date(2026, 5, 12, 12), 50, 'untagged-inside', false);
    yield* expense(new Date(2026, 5, 20, 12), 70, 'tagged-outside', true);
    yield* expense(new Date(2026, 5, 14, 23), 40, 'tagged-last-day', true);

    return { tag };
});

const createTripBudget = (tagId: number) =>
    createTestBudget({ name: 'Trip', kind: BudgetKindEnum.EVENT, tagId, startsAt: EVENT_STARTS_AT, endsAt: EVENT_ENDS_AT });

layer(TestLayer)('event budgets', it => {
    it.effect('spends only tagged entries inside the inclusive event days', () =>
        Effect.gen(function* () {
            const budgetRepository = yield* BudgetRepository;
            const { tag } = yield* seedTripExpenses();
            const entries = yield* budgetRepository.findEventSpentEntries(EVENT_STARTS_AT, EVENT_WINDOW_END, 1, tag.id);

            expect(computeSpent(entries, 1).spentOverall).toBe(units(140));
        })
    );

    it.effect('has no spend for an event without a tag', () =>
        Effect.gen(function* () {
            const budgetRepository = yield* BudgetRepository;

            yield* seedTripExpenses();

            expect(yield* budgetRepository.findEventSpentEntries(EVENT_STARTS_AT, EVENT_WINDOW_END, 1, null)).toEqual([]);
        })
    );

    it.effect('separates the main budget from active events', () =>
        Effect.gen(function* () {
            const budgetRepository = yield* BudgetRepository;
            const { tag } = yield* seedTripExpenses();
            const main = yield* createTestBudget();
            const event = yield* createTripBudget(tag.id);

            expect((yield* budgetRepository.findMain())?.id).toBe(main.id);
            expect((yield* budgetRepository.findActiveEvents(new Date(2026, 5, 12))).map(budget => budget.id)).toEqual([event.id]);
            expect((yield* budgetRepository.findActiveEvents(new Date(2026, 5, 14, 23))).map(budget => budget.id)).toEqual([event.id]);
            expect(yield* budgetRepository.findActiveEvents(new Date(2026, 5, 20))).toEqual([]);
            expect((yield* budgetRepository.findEvent(event.id))?.id).toBe(event.id);
            expect(yield* budgetRepository.findEvent(main.id)).toBeUndefined();
        })
    );

    it.effect('closes periods for the main budget only', () =>
        Effect.gen(function* () {
            const closeService = yield* BudgetPeriodCloseService;
            const snapshotRepository = yield* BudgetPeriodSnapshotRepository;
            const { tag } = yield* seedTripExpenses();
            const main = yield* createTestBudget();
            const event = yield* createTripBudget(tag.id);

            yield* closeService.closeDuePeriods(new Date(2026, 6, 15));

            expect((yield* snapshotRepository.findRecent(main.id, 5)).length).toBeGreaterThan(0);
            expect(yield* snapshotRepository.findRecent(event.id, 5)).toEqual([]);
        })
    );
});
