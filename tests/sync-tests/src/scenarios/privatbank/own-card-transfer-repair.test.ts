import {
    AccountBalanceRepository,
    convertFromMicroUnits,
    AccountEntityTable,
    AccountRepository,
    AccountTypeEnum,
    ExternalSourceEnum,
    TransactionEntityTable,
    TransactionEntryEntityTable,
    TransactionTypeEnum,
    TransactionUpdatedByEnum
} from '@budgie/contracts';
import { AccountArchiveService, TransactionTransferService } from '@budgie/ledger';
import {
    isPrivatbankOwnCardTransferTitle,
    privatbankTransactionMapper,
    SyncRepairService,
    UnpairedOwnCardTransferRepairService
} from '@budgie/sync';
import { describe, expect, it, vi } from '@effect/vitest';
import { and, eq, isNull } from 'drizzle-orm';
import * as Cause from 'effect/Cause';
import * as Effect from 'effect/Effect';

import { fetchAccountBalance, fetchCachedBalanceAmount, seed, testDb, TestLayer, testQueryService } from '../../harness';
import {
    buildOwnCardRow,
    buildOwnCardStatementClient,
    makeOwnCardStatementService
} from '../../harness/file-sync/privatbank-own-card-statement';

import type { AccountEntityInterface, TransactionEntityInterface } from '@budgie/contracts';
import type { PrivatbankRowInterface } from '@budgie/sync';

const OWN_CARD_INCOME_TITLE = 'Зі своєї картки *4321';
const OWN_CARD_EXPENSE_TITLE = 'На мою картку *1234';
const THIRD_PARTY_CARD_TITLE = 'Переказ на картку';
const UNKNOWN_CARD_INCOME_TITLE = 'Зі своєї картки *9999';
const OWN_CARD_AMOUNT = 10_000_000_000;
const OWN_CARD_FEE_AMOUNT = 25_000_000;
const NEAR_LEG_AMOUNT_GAP = 200_000_000;
const SMALL_LEG_AMOUNT = 100_000_000;
const OWN_CARD_OPERATED_AT = new Date('2026-03-04T09:15:00.000Z');
const ARCHIVED_BEFORE_INCOME_AT = new Date('2026-03-01T09:15:00.000Z');
const CONVERSION_FAILURE_MESSAGE = 'conversion failed';

const seedPrivatbankCard = (cardEnding: string) =>
    seed.account({
        title: `Privatbank •${cardEnding}`,
        type: AccountTypeEnum.BANK_SYNC,
        externalSource: ExternalSourceEnum.PRIVATBANK,
        externalId: `4000 **** **** ${cardEnding}`,
        iban: `UA00PRIVATBANK${cardEnding}`
    });

const archiveAccount = (accountId: number, archivedAt: Date = new Date()) =>
    Effect.asVoid(testDb.update(AccountEntityTable).set({ deletedAt: archivedAt }).where(eq(AccountEntityTable.id, accountId)));

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

const fetchLiveExpensesFromAccount = (accountId: number) =>
    testDb
        .select()
        .from(TransactionEntityTable)
        .where(
            and(
                eq(TransactionEntityTable.type, TransactionTypeEnum.EXPENSE),
                eq(TransactionEntityTable.fromAccountId, accountId),
                isNull(TransactionEntityTable.deletedAt)
            )
        );

const expectArchivedCardRestoredWithTransferOnly = Effect.fnUntraced(function* (
    archivedCard: AccountEntityInterface,
    otherOutflowAmount: number
) {
    const cardAccounts = yield* (yield* AccountRepository).findByExternalIds([archivedCard.externalId ?? '']);

    expect(cardAccounts.map(account => account.id)).toEqual([archivedCard.id]);
    expect(yield* fetchLiveExpensesFromAccount(archivedCard.id)).toHaveLength(0);
    expect(yield* fetchAccountBalance(archivedCard.id)).toBe(-OWN_CARD_AMOUNT - otherOutflowAmount);
});

const repairThenImportArchivedCardRows = Effect.fnUntraced(function* (buildRows: (card: string) => PrivatbankRowInterface[]) {
    const unpairedOwnCardTransferRepairService = yield* UnpairedOwnCardTransferRepairService;
    const { archivedCard } = yield* seedArchivedOwnCardScenario();
    const card = archivedCard.externalId ?? '';

    yield* unpairedOwnCardTransferRepairService.repair();
    yield* (yield* makeOwnCardStatementService(buildOwnCardStatementClient(buildRows(card)))).executeImportForSelectedAccounts(
        'statement.xlsx',
        [card]
    );

    return { archivedCard, card };
});

const importCardRows = Effect.fnUntraced(function* (card: string, rows: PrivatbankRowInterface[]) {
    yield* (yield* makeOwnCardStatementService(buildOwnCardStatementClient(rows))).executeImportForSelectedAccounts('statement.xlsx', [
        card
    ]);
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
    expect((yield* testQueryService.findTransactionById(income.id)).fromAccountId).toBe(archivedCard.id);
});

describe('privatbank/own-card-transfer-repair', () => {
    it.effect('repairs an own-card income whose counterpart card account was archived', () =>
        Effect.gen(function* () {
            const unpairedOwnCardTransferRepairService = yield* UnpairedOwnCardTransferRepairService;
            const { archivedCard, income, liveCard } = yield* seedArchivedOwnCardScenario();

            expect(yield* unpairedOwnCardTransferRepairService.countCandidates()).toBe(1);
            expect(yield* unpairedOwnCardTransferRepairService.repair()).toBe(1);

            const repaired = yield* testQueryService.findTransactionById(income.id);

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
            expect((yield* testQueryService.findTransactionById(income.id)).fromAccountId).toBe(archivedCard.id);
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

    it.effect('repairs an own-card income even when the counterpart was archived before it', () =>
        Effect.gen(function* () {
            const liveCard = yield* seedPrivatbankCard('1234');
            const income = yield* seedOwnCardIncome(liveCard.id);
            const archivedCard = yield* seedPrivatbankCard('4321');

            yield* archiveAccount(archivedCard.id, ARCHIVED_BEFORE_INCOME_AT);

            yield* expectRepairedFromCounterpart(archivedCard, income);
            yield* expectNothingLeftToRepair();
        }).pipe(Effect.provide(TestLayer))
    );

    it.effect('skips an ambiguous archived mask regardless of archive dates', () =>
        Effect.gen(function* () {
            const liveCard = yield* seedPrivatbankCard('1234');
            const earlierArchivedCard = yield* seedPrivatbankCard('4321');
            const laterArchivedCard = yield* seedPrivatbankCard('4321');
            yield* seedOwnCardIncome(liveCard.id);

            yield* archiveAccount(earlierArchivedCard.id, ARCHIVED_BEFORE_INCOME_AT);
            yield* archiveAccount(laterArchivedCard.id);

            yield* expectNothingLeftToRepair();
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

            const cause = yield* unpairedOwnCardTransferRepairService.repair().pipe(Effect.sandbox, Effect.flip);

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
            expect(yield* testQueryService.findTransactionById(supersededExpense.id)).toBeUndefined();

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
            expect((yield* testQueryService.findTransactionById(income.id)).type).toBe(TransactionTypeEnum.TRANSFER);
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
            expect(yield* testQueryService.findTransactionById(nearExpense.id)).toBeUndefined();
            expect(yield* testQueryService.findTransactionById(farExpense.id)).toBeDefined();
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

    it.effect.each([true, false])('excludes external accounts on either side (counterpart: %s)', externalCounterpart =>
        Effect.gen(function* () {
            const { archivedCard, liveCard } = yield* seedArchivedOwnCardScenario();

            yield* testDb
                .update(AccountEntityTable)
                .set({ isExternal: true })
                .where(eq(AccountEntityTable.id, externalCounterpart ? archivedCard.id : liveCard.id));

            yield* expectNothingLeftToRepair();
        }).pipe(Effect.provide(TestLayer))
    );

    it.effect.each([TransactionUpdatedByEnum.USER, TransactionUpdatedByEnum.RULE])(
        'preserves an edited own-card income through two repair runs (%s)',
        updatedBy =>
            Effect.gen(function* () {
                const { income } = yield* seedArchivedOwnCardScenario();

                yield* testDb.update(TransactionEntityTable).set({ updatedBy }).where(eq(TransactionEntityTable.id, income.id));
                const before = yield* testQueryService.findTransactionById(income.id);

                yield* expectNothingLeftToRepair();
                yield* expectNothingLeftToRepair();
                expect(yield* testQueryService.findTransactionById(income.id)).toEqual(before);
            }).pipe(Effect.provide(TestLayer))
    );

    it.effect('repairs pre- and post-archive incomes from the same tracked card as transfers', () =>
        Effect.gen(function* () {
            const repairService = yield* UnpairedOwnCardTransferRepairService;
            const { archivedCard, income, liveCard } = yield* seedArchivedOwnCardScenario();
            const laterIncome = yield* seed.bankPairIncome(
                { externalId: 'later-own-card-income', operatedAt: new Date('2026-03-06T09:15:00.000Z') },
                { accountId: liveCard.id, amount: OWN_CARD_AMOUNT }
            );

            yield* seed.updateTransaction(laterIncome.id, {
                title: OWN_CARD_INCOME_TITLE,
                externalSource: ExternalSourceEnum.PRIVATBANK
            });
            yield* archiveAccount(archivedCard.id, new Date('2026-03-05T09:15:00.000Z'));

            expect(yield* repairService.countCandidates()).toBe(2);
            expect(yield* repairService.repair()).toBe(2);
            for (const transactionId of [income.id, laterIncome.id]) {
                expect(yield* testQueryService.findTransactionById(transactionId)).toMatchObject({
                    type: TransactionTypeEnum.TRANSFER,
                    fromAccountId: archivedCard.id,
                    toAccountId: liveCard.id
                });
            }
            yield* expectNothingLeftToRepair();
        }).pipe(Effect.provide(TestLayer))
    );

    it.effect('preserves a user-converted transfer after the counterpart archive through two repair runs', () =>
        Effect.gen(function* () {
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

            yield* testDb
                .update(TransactionEntityTable)
                .set({ updatedBy: TransactionUpdatedByEnum.USER })
                .where(eq(TransactionEntityTable.id, income.id));
            yield* expectNothingLeftToRepair();

            const healed = yield* testQueryService.findTransactionById(income.id);

            expect(healed.type).toBe(TransactionTypeEnum.TRANSFER);
            expect(healed.fromAccountId).toBe(archivedCard.id);
            expect(healed.toAccountId).toBe(liveCard.id);
            expect((yield* accountBalanceRepository.getLedgerBalances([liveCard.id])).get(liveCard.id)).toBe(liveBalanceBefore);
            yield* expectNothingLeftToRepair();
        }).pipe(Effect.provide(TestLayer))
    );

    it.effect('skips an own-card income whose card mask also belongs to a live account', () =>
        Effect.gen(function* () {
            yield* seedArchivedOwnCardScenario();
            yield* seedPrivatbankCard('4321');

            yield* expectNothingLeftToRepair();
        }).pipe(Effect.provide(TestLayer))
    );

    it.effect('restores the archived card on a statement import without duplicating the repaired transfer leg', () =>
        Effect.gen(function* () {
            const unpairedOwnCardTransferRepairService = yield* UnpairedOwnCardTransferRepairService;
            const accountBalanceRepository = yield* AccountBalanceRepository;
            const { archivedCard } = yield* seedArchivedOwnCardScenario();
            const savings = yield* seed.account({ title: 'Savings' });
            const savingsTransfer = yield* seed.bankPairExpense(
                { externalId: 'privatbank-savings-transfer', operatedAt: ARCHIVED_BEFORE_INCOME_AT },
                { accountId: archivedCard.id, amount: OWN_CARD_FEE_AMOUNT }
            );
            const statement = buildOwnCardStatementClient([
                buildOwnCardRow(archivedCard.externalId ?? '', -convertFromMicroUnits(OWN_CARD_AMOUNT), OWN_CARD_EXPENSE_TITLE)
            ]);

            yield* testDb.update(AccountEntityTable).set({ deletedAt: null }).where(eq(AccountEntityTable.id, archivedCard.id));
            yield* (yield* TransactionTransferService).convertExpenseToTransfer({
                id: savingsTransfer.id,
                accountId: savings.id,
                customExchangeRate: 1,
                feeEntries: []
            });
            yield* (yield* AccountArchiveService).archiveById(archivedCard.id);
            yield* unpairedOwnCardTransferRepairService.repair();
            yield* (yield* makeOwnCardStatementService(statement)).executeImportForSelectedAccounts('statement.xlsx', [
                archivedCard.externalId ?? ''
            ]);

            yield* expectArchivedCardRestoredWithTransferOnly(archivedCard, OWN_CARD_FEE_AMOUNT);
            expect(yield* fetchCachedBalanceAmount(savings.id)).toBe(
                (yield* accountBalanceRepository.getLedgerBalances([savings.id])).get(savings.id)
            );
            expect(yield* fetchCachedBalanceAmount(savings.id)).toBe(OWN_CARD_FEE_AMOUNT);
        }).pipe(Effect.provide(TestLayer))
    );

    it.effect('folds a live duplicate of an archived card into it through the sync repairs', () =>
        Effect.gen(function* () {
            const unpairedOwnCardTransferRepairService = yield* UnpairedOwnCardTransferRepairService;
            const syncRepairService = yield* SyncRepairService;
            const accountArchiveService = yield* AccountArchiveService;
            const { archivedCard } = yield* seedArchivedOwnCardScenario();
            const archivedPurchase = yield* seed.bankPairExpense(
                { externalId: 'privatbank-shared-purchase', operatedAt: ARCHIVED_BEFORE_INCOME_AT },
                { accountId: archivedCard.id, amount: OWN_CARD_FEE_AMOUNT }
            );

            yield* seed.updateTransaction(archivedPurchase.id, { externalSource: ExternalSourceEnum.PRIVATBANK });
            yield* testDb.update(AccountEntityTable).set({ deletedAt: null }).where(eq(AccountEntityTable.id, archivedCard.id));
            yield* accountArchiveService.archiveById(archivedCard.id);
            yield* unpairedOwnCardTransferRepairService.repair();

            const duplicateCard = yield* seedPrivatbankCard('4321');
            const duplicatePurchase = yield* seed.bankPairExpense(
                { externalId: 'privatbank-shared-purchase', operatedAt: ARCHIVED_BEFORE_INCOME_AT },
                { accountId: duplicateCard.id, amount: OWN_CARD_FEE_AMOUNT }
            );

            yield* seed.updateTransaction(duplicatePurchase.id, { externalSource: ExternalSourceEnum.PRIVATBANK });
            yield* seedOwnCardCounterpartExpense(duplicateCard.id);

            expect((yield* syncRepairService.previewDuplicates()).duplicateTransactionCount).toBeGreaterThan(0);
            yield* syncRepairService.removeDuplicates();

            const cardAccounts = yield* (yield* AccountRepository).findByExternalIds([archivedCard.externalId ?? '']);

            expect(cardAccounts.map(account => account.id)).toEqual([archivedCard.id]);
            expect((yield* fetchLiveExpensesFromAccount(archivedCard.id)).map(transaction => transaction.externalId)).toEqual([
                'privatbank-shared-purchase'
            ]);
            expect(yield* fetchAccountBalance(archivedCard.id)).toBe(-OWN_CARD_AMOUNT - OWN_CARD_FEE_AMOUNT);
            expect((yield* syncRepairService.previewDuplicates()).duplicateTransactionCount).toBe(0);
        }).pipe(Effect.provide(TestLayer))
    );

    it.effect('imports a purchase that sits near a repaired transfer leg without own-card evidence', () =>
        Effect.gen(function* () {
            const unpairedOwnCardTransferRepairService = yield* UnpairedOwnCardTransferRepairService;
            const { archivedCard } = yield* seedArchivedOwnCardScenario();
            const statement = buildOwnCardStatementClient([
                buildOwnCardRow(archivedCard.externalId ?? '', -convertFromMicroUnits(OWN_CARD_AMOUNT - OWN_CARD_FEE_AMOUNT), 'Amazon')
            ]);

            yield* unpairedOwnCardTransferRepairService.repair();
            yield* (yield* makeOwnCardStatementService(statement)).executeImportForSelectedAccounts('statement.xlsx', [
                archivedCard.externalId ?? ''
            ]);

            expect((yield* fetchLiveExpensesFromAccount(archivedCard.id)).map(transaction => transaction.title)).toEqual(['Amazon']);
        }).pipe(Effect.provide(TestLayer))
    );

    it.effect.each([false, true])('skips only the own-card row that matches the repaired leg (reversed: %s)', isReversed =>
        Effect.gen(function* () {
            const unpairedOwnCardTransferRepairService = yield* UnpairedOwnCardTransferRepairService;
            const { archivedCard } = yield* seedArchivedOwnCardScenario();
            const card = archivedCard.externalId ?? '';
            const smallerTransfer = buildOwnCardRow(
                card,
                -convertFromMicroUnits(OWN_CARD_AMOUNT - NEAR_LEG_AMOUNT_GAP),
                OWN_CARD_EXPENSE_TITLE
            );
            const matchingTransfer = buildOwnCardRow(card, -convertFromMicroUnits(OWN_CARD_AMOUNT), OWN_CARD_EXPENSE_TITLE);
            const rows = isReversed ? [matchingTransfer, smallerTransfer] : [smallerTransfer, matchingTransfer];

            yield* unpairedOwnCardTransferRepairService.repair();
            yield* (yield* makeOwnCardStatementService(buildOwnCardStatementClient(rows))).executeImportForSelectedAccounts(
                'statement.xlsx',
                [card]
            );

            expect(yield* fetchLiveExpensesFromAccount(archivedCard.id)).toHaveLength(1);
            expect(yield* fetchAccountBalance(archivedCard.id)).toBe(-OWN_CARD_AMOUNT - (OWN_CARD_AMOUNT - NEAR_LEG_AMOUNT_GAP));
        }).pipe(Effect.provide(TestLayer))
    );

    it.effect('imports a separate own-card row far larger than the repaired leg', () =>
        Effect.gen(function* () {
            const { archivedCard } = yield* repairThenImportArchivedCardRows(card => [
                buildOwnCardRow(card, -convertFromMicroUnits(OWN_CARD_AMOUNT * 10), OWN_CARD_EXPENSE_TITLE)
            ]);

            expect(yield* fetchLiveExpensesFromAccount(archivedCard.id)).toHaveLength(1);
        }).pipe(Effect.provide(TestLayer))
    );

    it.effect('imports a separate own-card row smaller than the repaired leg', () =>
        Effect.gen(function* () {
            const { archivedCard } = yield* repairThenImportArchivedCardRows(card => [
                buildOwnCardRow(card, -convertFromMicroUnits(OWN_CARD_AMOUNT / 10), OWN_CARD_EXPENSE_TITLE)
            ]);

            expect(yield* fetchLiveExpensesFromAccount(archivedCard.id)).toHaveLength(1);
        }).pipe(Effect.provide(TestLayer))
    );

    it.effect('lets an already imported row keep its leg so a new own-card row is imported', () =>
        Effect.gen(function* () {
            const unpairedOwnCardTransferRepairService = yield* UnpairedOwnCardTransferRepairService;
            const { archivedCard } = yield* seedArchivedOwnCardScenario();
            const card = archivedCard.externalId ?? '';
            const knownRow = {
                ...buildOwnCardRow(card, -convertFromMicroUnits(OWN_CARD_AMOUNT + OWN_CARD_FEE_AMOUNT), OWN_CARD_EXPENSE_TITLE),
                operationAmount: convertFromMicroUnits(OWN_CARD_AMOUNT)
            };
            const newRow = buildOwnCardRow(card, -convertFromMicroUnits(OWN_CARD_AMOUNT), OWN_CARD_EXPENSE_TITLE);

            yield* unpairedOwnCardTransferRepairService.repair();
            const knownExpense = yield* seed.bankPairExpense(
                { externalId: privatbankTransactionMapper(knownRow).id, operatedAt: OWN_CARD_OPERATED_AT },
                { accountId: archivedCard.id, amount: OWN_CARD_AMOUNT + OWN_CARD_FEE_AMOUNT }
            );
            yield* seed.updateTransaction(knownExpense.id, {
                externalSource: ExternalSourceEnum.PRIVATBANK,
                title: OWN_CARD_EXPENSE_TITLE
            });
            yield* importCardRows(card, [knownRow, newRow]);

            expect(yield* fetchLiveExpensesFromAccount(archivedCard.id)).toHaveLength(2);
            expect(yield* fetchAccountBalance(archivedCard.id)).toBe(-OWN_CARD_AMOUNT * 3 - OWN_CARD_FEE_AMOUNT);
        }).pipe(Effect.provide(TestLayer))
    );

    it.effect('keeps a skipped row on its leg so a later own-card row is imported and the skipped row stays out', () =>
        Effect.gen(function* () {
            const claimingRow = (card: string) => buildOwnCardRow(card, -convertFromMicroUnits(OWN_CARD_AMOUNT), OWN_CARD_EXPENSE_TITLE);
            const { archivedCard, card } = yield* repairThenImportArchivedCardRows(currentCard => [claimingRow(currentCard)]);
            const laterRow = buildOwnCardRow(
                card,
                -convertFromMicroUnits(OWN_CARD_AMOUNT),
                OWN_CARD_EXPENSE_TITLE,
                new Date(OWN_CARD_OPERATED_AT.getTime() + 3_600_000)
            );

            yield* importCardRows(card, [laterRow]);
            yield* importCardRows(card, [claimingRow(card), laterRow]);

            expect(yield* fetchLiveExpensesFromAccount(archivedCard.id)).toHaveLength(1);
            expect(yield* fetchAccountBalance(archivedCard.id)).toBe(-OWN_CARD_AMOUNT * 2);
        }).pipe(Effect.provide(TestLayer))
    );

    it.effect('imports a separate ₴10 incoming own-card row beside a ₴100 repaired leg', () =>
        Effect.gen(function* () {
            const unpairedOwnCardTransferRepairService = yield* UnpairedOwnCardTransferRepairService;
            const liveCard = yield* seedPrivatbankCard('1234');
            const archivedCard = yield* seedPrivatbankCard('4321');
            const outgoing = yield* seed.bankPairExpense(
                { externalId: 'privatbank-own-card-outgoing', operatedAt: OWN_CARD_OPERATED_AT },
                { accountId: liveCard.id, amount: SMALL_LEG_AMOUNT }
            );
            const card = archivedCard.externalId ?? '';

            yield* seed.updateTransaction(outgoing.id, { externalSource: ExternalSourceEnum.PRIVATBANK, title: 'На мою картку *4321' });
            yield* archiveAccount(archivedCard.id);
            yield* unpairedOwnCardTransferRepairService.repair();
            yield* importCardRows(card, [buildOwnCardRow(card, convertFromMicroUnits(SMALL_LEG_AMOUNT / 10), 'Зі своєї картки *1234')]);

            expect(yield* fetchAccountBalance(archivedCard.id)).toBe(SMALL_LEG_AMOUNT + SMALL_LEG_AMOUNT / 10);
        }).pipe(Effect.provide(TestLayer))
    );

    it.effect('skips a sender row whose operation amount equals the leg while its card amount carries the fee', () =>
        Effect.gen(function* () {
            const { archivedCard } = yield* repairThenImportArchivedCardRows(card => [
                {
                    ...buildOwnCardRow(card, -convertFromMicroUnits(OWN_CARD_AMOUNT + OWN_CARD_FEE_AMOUNT), OWN_CARD_EXPENSE_TITLE),
                    operationAmount: convertFromMicroUnits(OWN_CARD_AMOUNT)
                }
            ]);

            expect(yield* fetchLiveExpensesFromAccount(archivedCard.id)).toHaveLength(0);
        }).pipe(Effect.provide(TestLayer))
    );

    it.effect('lets a persisted leg claim win over a closer unclaimed leg', () =>
        Effect.gen(function* () {
            const unpairedOwnCardTransferRepairService = yield* UnpairedOwnCardTransferRepairService;
            const { archivedCard, liveCard } = yield* seedArchivedOwnCardScenario();
            const card = archivedCard.externalId ?? '';
            const atOffset = (minutes: number) => new Date(OWN_CARD_OPERATED_AT.getTime() + minutes * 60_000);
            const claimedIncome = yield* seed.bankPairIncome(
                { externalId: 'privatbank-claimed-income', operatedAt: atOffset(180) },
                { accountId: liveCard.id, amount: OWN_CARD_AMOUNT }
            );
            const claimingRow = buildOwnCardRow(card, -convertFromMicroUnits(OWN_CARD_AMOUNT), OWN_CARD_EXPENSE_TITLE, atOffset(5));
            const realCounterpart = buildOwnCardRow(card, -convertFromMicroUnits(OWN_CARD_AMOUNT), OWN_CARD_EXPENSE_TITLE, atOffset(60));

            yield* seed.updateTransaction(claimedIncome.id, {
                externalSource: ExternalSourceEnum.PRIVATBANK,
                title: OWN_CARD_INCOME_TITLE
            });
            yield* unpairedOwnCardTransferRepairService.repair();
            yield* testDb
                .update(TransactionEntryEntityTable)
                .set({ externalId: privatbankTransactionMapper(claimingRow).id })
                .where(
                    and(
                        eq(TransactionEntryEntityTable.transactionId, claimedIncome.id),
                        eq(TransactionEntryEntityTable.accountId, archivedCard.id)
                    )
                );
            yield* importCardRows(card, [claimingRow, realCounterpart]);

            expect(yield* fetchLiveExpensesFromAccount(archivedCard.id)).toHaveLength(0);
        }).pipe(Effect.provide(TestLayer))
    );

    it.effect('requires a non-empty counterpart card ending in the own-card title evidence', () =>
        Effect.sync(() => {
            const title = 'На мою картку *1234';

            expect(isPrivatbankOwnCardTransferTitle(title, { counterpartExternalId: '', counterpartIban: null })).toBe(false);
            expect(isPrivatbankOwnCardTransferTitle(title, { counterpartExternalId: '', counterpartIban: 'UA00PRIVATBANK1234' })).toBe(
                true
            );
            expect(isPrivatbankOwnCardTransferTitle(title, { counterpartExternalId: '4000 **** **** 9999', counterpartIban: null })).toBe(
                false
            );
        })
    );
});
