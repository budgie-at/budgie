import {
    AccountBalanceRepository,
    AccountEntityTable,
    AccountTypeEnum,
    ExternalSourceEnum,
    TransactionEntityTable,
    TransactionEntryEntityTable,
    TransactionTypeEnum
} from '@budgie/contracts';
import { AccountArchiveService, TransactionTransferService } from '@budgie/ledger';
import { UnpairedOwnCardTransferRepairService } from '@budgie/sync';
import { describe, expect, it, vi } from '@effect/vitest';
import { and, eq, isNull } from 'drizzle-orm';
import * as Cause from 'effect/Cause';
import * as Effect from 'effect/Effect';

import { fetchTransactionById, seed, testDb, TestLayer } from '../../harness';

import type { AccountEntityInterface, TransactionEntityInterface } from '@budgie/contracts';

const OWN_CARD_INCOME_TITLE = 'Зі своєї картки *4321';
const OWN_CARD_EXPENSE_TITLE = 'На мою картку *1234';
const THIRD_PARTY_CARD_TITLE = 'Переказ на картку';
const UNKNOWN_CARD_INCOME_TITLE = 'Зі своєї картки *9999';
const OWN_CARD_AMOUNT = 10_000_000_000;
const OWN_CARD_FEE_AMOUNT = 25_000_000;
const OWN_CARD_OPERATED_AT = new Date('2026-03-04T09:15:00.000Z');
const ARCHIVED_BEFORE_INCOME_AT = new Date('2026-03-01T09:15:00.000Z');
const CONVERSION_FAILURE_MESSAGE = 'conversion failed';

const seedPrivatbankCard = (cardEnding: string) =>
    Effect.gen(function* () {
        return yield* seed.account({
            title: `Privatbank •${cardEnding}`,
            type: AccountTypeEnum.BANK_SYNC,
            externalSource: ExternalSourceEnum.PRIVATBANK,
            externalId: `4000 **** **** ${cardEnding}`,
            iban: `UA00PRIVATBANK${cardEnding}`
        });
    });

const archiveAccount = (accountId: number, archivedAt: Date = new Date()) =>
    Effect.gen(function* () {
        yield* testDb.update(AccountEntityTable).set({ deletedAt: archivedAt }).where(eq(AccountEntityTable.id, accountId));
    });

const seedOwnCardIncome = (accountId: number, title: string = OWN_CARD_INCOME_TITLE) =>
    Effect.gen(function* () {
        const income = yield* seed.bankPairIncome(
            { externalId: 'privatbank-own-card-income', operatedAt: OWN_CARD_OPERATED_AT },
            { accountId, amount: OWN_CARD_AMOUNT }
        );

        return yield* seed.updateTransaction(income.id, { externalSource: ExternalSourceEnum.PRIVATBANK, title });
    });

const softDeleteTransaction = (transactionId: number) =>
    Effect.gen(function* () {
        const deletedAt = new Date();

        yield* testDb.update(TransactionEntityTable).set({ deletedAt }).where(eq(TransactionEntityTable.id, transactionId));
        yield* testDb
            .update(TransactionEntryEntityTable)
            .set({ deletedAt })
            .where(eq(TransactionEntryEntityTable.transactionId, transactionId));
    });

const seedOwnCardCounterpartExpense = (accountId: number) =>
    Effect.gen(function* () {
        const expense = yield* seed.bankPairExpense(
            { externalId: 'privatbank-own-card-expense', operatedAt: OWN_CARD_OPERATED_AT },
            { accountId, amount: OWN_CARD_AMOUNT }
        );

        return yield* seed.updateTransaction(expense.id, { externalSource: ExternalSourceEnum.PRIVATBANK, title: OWN_CARD_EXPENSE_TITLE });
    });

const seedArchivedOwnCardScenario = () =>
    Effect.gen(function* () {
        const liveCard = yield* seedPrivatbankCard('1234');
        const archivedCard = yield* seedPrivatbankCard('4321');
        const income = yield* seedOwnCardIncome(liveCard.id);

        yield* archiveAccount(archivedCard.id);

        return { archivedCard, income, liveCard };
    });

const seedArchivedCardWithMask = (externalId: string | null, iban: string) =>
    Effect.gen(function* () {
        const archivedCard = yield* seed.account({
            title: 'Privatbank •4321',
            type: AccountTypeEnum.BANK_SYNC,
            externalSource: ExternalSourceEnum.PRIVATBANK,
            externalId,
            iban
        });

        yield* archiveAccount(archivedCard.id);

        return archivedCard;
    });

const expectNoLiveEntriesOnAccount = Effect.fnUntraced(function* (accountId: number) {
    expect(
        yield* testDb
            .select()
            .from(TransactionEntryEntityTable)
            .where(and(eq(TransactionEntryEntityTable.accountId, accountId), isNull(TransactionEntryEntityTable.deletedAt)))
    ).toHaveLength(0);
});

const expectNothingLeftToRepair = Effect.fnUntraced(function* () {
    const unpairedOwnCardTransferRepairService = yield* UnpairedOwnCardTransferRepairService;

    expect(yield* unpairedOwnCardTransferRepairService.countCandidates()).toBe(0);
    expect(yield* unpairedOwnCardTransferRepairService.repair()).toBe(0);
});

const expectRepairedFromCounterpart = Effect.fnUntraced(function* (
    archivedCard: AccountEntityInterface,
    income: TransactionEntityInterface
) {
    const unpairedOwnCardTransferRepairService = yield* UnpairedOwnCardTransferRepairService;

    expect(yield* unpairedOwnCardTransferRepairService.countCandidates()).toBe(1);
    expect(yield* unpairedOwnCardTransferRepairService.repair()).toBe(1);
    expect((yield* fetchTransactionById(income.id)).fromAccountId).toBe(archivedCard.id);
});

describe('privatbank/own-card-transfer-repair', () => {
    it.effect('repairs an own-card income whose counterpart card account was archived', () =>
        Effect.gen(function* () {
            const unpairedOwnCardTransferRepairService = yield* UnpairedOwnCardTransferRepairService;
            const { archivedCard, income, liveCard } = yield* seedArchivedOwnCardScenario();

            expect(yield* unpairedOwnCardTransferRepairService.countCandidates()).toBe(1);
            expect(yield* unpairedOwnCardTransferRepairService.repair()).toBe(1);

            const repaired = yield* fetchTransactionById(income.id);

            expect(repaired.type).toBe(TransactionTypeEnum.TRANSFER);
            expect(repaired.fromAccountId).toBe(archivedCard.id);
            expect(repaired.toAccountId).toBe(liveCard.id);
        }).pipe(Effect.provide(TestLayer))
    );

    it.effect('leaves nothing to repair after a first repair pass', () =>
        Effect.gen(function* () {
            const unpairedOwnCardTransferRepairService = yield* UnpairedOwnCardTransferRepairService;
            const { archivedCard, income } = yield* seedArchivedOwnCardScenario();

            yield* unpairedOwnCardTransferRepairService.repair();

            yield* expectNothingLeftToRepair();
            expect((yield* fetchTransactionById(income.id)).fromAccountId).toBe(archivedCard.id);
        }).pipe(Effect.provide(TestLayer))
    );

    it.effect('counts an own-card income with a fee entry once', () =>
        Effect.gen(function* () {
            const unpairedOwnCardTransferRepairService = yield* UnpairedOwnCardTransferRepairService;
            const liveCard = yield* seedPrivatbankCard('1234');
            const archivedCard = yield* seedPrivatbankCard('4321');
            const income = yield* seedOwnCardIncome(liveCard.id);

            yield* seed.feeEntry(income.id, 'privatbank-own-card-income-fee', { accountId: liveCard.id, amount: OWN_CARD_FEE_AMOUNT });
            yield* archiveAccount(archivedCard.id);

            expect(yield* unpairedOwnCardTransferRepairService.countCandidates()).toBe(1);
            expect(yield* unpairedOwnCardTransferRepairService.repair()).toBe(1);
        }).pipe(Effect.provide(TestLayer))
    );

    it.effect('leaves an own-card income from a card archived before the income untouched', () =>
        Effect.gen(function* () {
            const liveCard = yield* seedPrivatbankCard('1234');
            const income = yield* seedOwnCardIncome(liveCard.id);
            const archivedCard = yield* seedPrivatbankCard('4321');

            yield* archiveAccount(archivedCard.id, ARCHIVED_BEFORE_INCOME_AT);

            yield* expectNothingLeftToRepair();
            expect((yield* fetchTransactionById(income.id)).type).toBe(TransactionTypeEnum.INCOME);
            yield* expectNoLiveEntriesOnAccount(archivedCard.id);
        }).pipe(Effect.provide(TestLayer))
    );

    it.effect('repairs against the card archived after the income when another card with the same ending was archived before it', () =>
        Effect.gen(function* () {
            const liveCard = yield* seedPrivatbankCard('1234');
            const earlierArchivedCard = yield* seedPrivatbankCard('4321');
            const laterArchivedCard = yield* seedPrivatbankCard('4321');
            const income = yield* seedOwnCardIncome(liveCard.id);

            yield* archiveAccount(earlierArchivedCard.id, ARCHIVED_BEFORE_INCOME_AT);
            yield* archiveAccount(laterArchivedCard.id);

            yield* expectRepairedFromCounterpart(laterArchivedCard, income);
        }).pipe(Effect.provide(TestLayer))
    );

    it.effect('ignores a maskless third-party card transfer', () =>
        Effect.gen(function* () {
            const unpairedOwnCardTransferRepairService = yield* UnpairedOwnCardTransferRepairService;
            const liveCard = yield* seedPrivatbankCard('1234');
            const archivedCard = yield* seedPrivatbankCard('4321');
            const expense = yield* seed.bankPairExpense(
                { externalId: 'privatbank-third-party-expense', operatedAt: OWN_CARD_OPERATED_AT },
                { accountId: liveCard.id, amount: OWN_CARD_AMOUNT }
            );

            yield* seed.updateTransaction(expense.id, { externalSource: ExternalSourceEnum.PRIVATBANK, title: THIRD_PARTY_CARD_TITLE });
            yield* archiveAccount(archivedCard.id);

            expect(yield* unpairedOwnCardTransferRepairService.countCandidates()).toBe(0);
        }).pipe(Effect.provide(TestLayer))
    );

    it.effect('repairs an own-card income whose counterpart leg was archived together with the card', () =>
        Effect.gen(function* () {
            const liveCard = yield* seedPrivatbankCard('1234');
            const archivedCard = yield* seedPrivatbankCard('4321');
            const income = yield* seedOwnCardIncome(liveCard.id);

            yield* softDeleteTransaction((yield* seedOwnCardCounterpartExpense(archivedCard.id)).id);
            yield* archiveAccount(archivedCard.id);

            yield* expectRepairedFromCounterpart(archivedCard, income);
        }).pipe(Effect.provide(TestLayer))
    );

    it.effect('ignores an own-card income whose card mask resolves to no archived account', () =>
        Effect.gen(function* () {
            const unpairedOwnCardTransferRepairService = yield* UnpairedOwnCardTransferRepairService;
            const liveCard = yield* seedPrivatbankCard('1234');
            const archivedCard = yield* seedPrivatbankCard('4321');

            yield* seedOwnCardIncome(liveCard.id, UNKNOWN_CARD_INCOME_TITLE);
            yield* archiveAccount(archivedCard.id);

            expect(yield* unpairedOwnCardTransferRepairService.countCandidates()).toBe(0);
        }).pipe(Effect.provide(TestLayer))
    );

    it.effect('rejects when a candidate conversion fails', () =>
        Effect.gen(function* () {
            const unpairedOwnCardTransferRepairService = yield* UnpairedOwnCardTransferRepairService;
            const transactionTransferService = yield* TransactionTransferService;
            yield* seedArchivedOwnCardScenario();

            yield* Effect.addFinalizer(() => Effect.sync(() => vi.restoreAllMocks()));
            vi.spyOn(transactionTransferService, 'convertIncomeToTransfer').mockReturnValue(
                Effect.die(new Error(CONVERSION_FAILURE_MESSAGE))
            );

            const cause = yield* Effect.flip(Effect.sandbox(unpairedOwnCardTransferRepairService.repair()));

            expect(Cause.squash(cause)).toMatchObject({ message: CONVERSION_FAILURE_MESSAGE });

            expect(yield* unpairedOwnCardTransferRepairService.countCandidates()).toBe(1);
        }).pipe(Effect.provide(TestLayer))
    );

    it.effect('ignores an own-card income that still has a live counterpart leg', () =>
        Effect.gen(function* () {
            const unpairedOwnCardTransferRepairService = yield* UnpairedOwnCardTransferRepairService;
            const liveCard = yield* seedPrivatbankCard('1234');
            const archivedCard = yield* seedPrivatbankCard('4321');

            yield* seedOwnCardIncome(liveCard.id);
            yield* seedOwnCardCounterpartExpense(archivedCard.id);
            yield* archiveAccount(archivedCard.id);

            expect(yield* unpairedOwnCardTransferRepairService.countCandidates()).toBe(0);
        }).pipe(Effect.provide(TestLayer))
    );

    it.effect('matches the counterpart card by external_id when its IBAN suffix differs', () =>
        Effect.gen(function* () {
            const liveCard = yield* seedPrivatbankCard('1234');
            const archivedCard = yield* seedArchivedCardWithMask('4000 **** **** 4321', 'UA00PRIVATBANK9999');
            const income = yield* seedOwnCardIncome(liveCard.id);

            yield* expectRepairedFromCounterpart(archivedCard, income);
        }).pipe(Effect.provide(TestLayer))
    );

    it.effect('falls back to the IBAN suffix when the counterpart card has no external_id', () =>
        Effect.gen(function* () {
            const liveCard = yield* seedPrivatbankCard('1234');
            const archivedCard = yield* seedArchivedCardWithMask(null, 'UA00PRIVATBANK4321');
            const income = yield* seedOwnCardIncome(liveCard.id);

            yield* expectRepairedFromCounterpart(archivedCard, income);
        }).pipe(Effect.provide(TestLayer))
    );

    it.effect('deletes the superseded counterpart leg so restoring the archived card does not double count it', () =>
        Effect.gen(function* () {
            const unpairedOwnCardTransferRepairService = yield* UnpairedOwnCardTransferRepairService;
            const accountArchiveService = yield* AccountArchiveService;
            const liveCard = yield* seedPrivatbankCard('1234');
            const archivedCard = yield* seedPrivatbankCard('4321');
            const income = yield* seedOwnCardIncome(liveCard.id);
            const supersededExpense = yield* seedOwnCardCounterpartExpense(archivedCard.id);

            yield* softDeleteTransaction(supersededExpense.id);
            yield* archiveAccount(archivedCard.id);

            expect(yield* unpairedOwnCardTransferRepairService.repair()).toBe(1);
            expect(yield* fetchTransactionById(supersededExpense.id)).toBeUndefined();

            yield* accountArchiveService.restoreById(archivedCard.id);

            const liveExpensesOnArchivedCard = yield* testDb
                .select()
                .from(TransactionEntityTable)
                .where(
                    and(
                        eq(TransactionEntityTable.type, TransactionTypeEnum.EXPENSE),
                        eq(TransactionEntityTable.fromAccountId, archivedCard.id),
                        isNull(TransactionEntityTable.deletedAt)
                    )
                );

            expect(liveExpensesOnArchivedCard).toHaveLength(0);
            expect((yield* fetchTransactionById(income.id)).type).toBe(TransactionTypeEnum.TRANSFER);
        }).pipe(Effect.provide(TestLayer))
    );

    it.effect('deletes only the nearest superseded counterpart leg when several qualify', () =>
        Effect.gen(function* () {
            const unpairedOwnCardTransferRepairService = yield* UnpairedOwnCardTransferRepairService;
            const liveCard = yield* seedPrivatbankCard('1234');
            const archivedCard = yield* seedPrivatbankCard('4321');

            yield* seedOwnCardIncome(liveCard.id);

            const farExpense = yield* seed.updateTransaction(
                (yield* seed.bankPairExpense(
                    { externalId: 'privatbank-far-expense', operatedAt: new Date(OWN_CARD_OPERATED_AT.getTime() + 60_000) },
                    { accountId: archivedCard.id, amount: OWN_CARD_AMOUNT }
                )).id,
                { externalSource: ExternalSourceEnum.PRIVATBANK, title: OWN_CARD_EXPENSE_TITLE }
            );
            const nearExpense = yield* seedOwnCardCounterpartExpense(archivedCard.id);

            yield* softDeleteTransaction(farExpense.id);
            yield* softDeleteTransaction(nearExpense.id);
            yield* archiveAccount(archivedCard.id);

            expect(yield* unpairedOwnCardTransferRepairService.repair()).toBe(1);
            expect(yield* fetchTransactionById(nearExpense.id)).toBeUndefined();
            expect(yield* fetchTransactionById(farExpense.id)).toBeDefined();
        }).pipe(Effect.provide(TestLayer))
    );

    it.effect('keeps the archived counterpart balance at 0 after the repair leaves a live transfer leg on it', () =>
        Effect.gen(function* () {
            const unpairedOwnCardTransferRepairService = yield* UnpairedOwnCardTransferRepairService;
            const accountBalanceRepository = yield* AccountBalanceRepository;
            const { archivedCard } = yield* seedArchivedOwnCardScenario();

            yield* unpairedOwnCardTransferRepairService.repair();

            const archivedBalanceRow = (yield* accountBalanceRepository.getArchivedAccountBalance(archivedCard.id)).at(0);

            expect(archivedBalanceRow?.balance).toBe(0);
        }).pipe(Effect.provide(TestLayer))
    );

    it.effect('heals a transfer from a card archived before the operation back to an income on the live card', () =>
        Effect.gen(function* () {
            const unpairedOwnCardTransferRepairService = yield* UnpairedOwnCardTransferRepairService;
            const transactionTransferService = yield* TransactionTransferService;
            const accountBalanceRepository = yield* AccountBalanceRepository;
            const liveCard = yield* seedPrivatbankCard('1234');
            const archivedCard = yield* seedPrivatbankCard('4321');
            const income = yield* seedOwnCardIncome(liveCard.id);
            const liveBalanceBefore = (yield* accountBalanceRepository.getLedgerBalances([liveCard.id])).get(liveCard.id);

            yield* transactionTransferService.convertIncomeToTransfer({
                id: income.id,
                accountId: archivedCard.id,
                customExchangeRate: 1,
                feeEntries: []
            });
            yield* archiveAccount(archivedCard.id, ARCHIVED_BEFORE_INCOME_AT);

            expect(yield* unpairedOwnCardTransferRepairService.countCandidates()).toBe(1);
            expect(yield* unpairedOwnCardTransferRepairService.repair()).toBe(1);

            const healed = yield* fetchTransactionById(income.id);

            expect(healed.type).toBe(TransactionTypeEnum.INCOME);
            expect(healed.fromAccountId).toBeNull();
            expect(healed.toAccountId).toBe(liveCard.id);
            yield* expectNoLiveEntriesOnAccount(archivedCard.id);
            expect((yield* accountBalanceRepository.getLedgerBalances([liveCard.id])).get(liveCard.id)).toBe(liveBalanceBefore);
            yield* expectNothingLeftToRepair();
        }).pipe(Effect.provide(TestLayer))
    );
});
