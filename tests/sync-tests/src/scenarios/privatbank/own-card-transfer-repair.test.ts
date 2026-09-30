import { AccountArchiveService } from '@app/account/service/account-archive.service';
import { UnpairedOwnCardTransferRepairService } from '@app/sync/service/unpaired-own-card-transfer-repair.service';
import { TransactionTransferService } from '@app/transaction/service/transaction-transfer.service';
import {
    AccountBalanceRepository,
    AccountEntityTable,
    AccountTypeEnum,
    ExternalSourceEnum,
    TransactionEntityTable,
    TransactionEntryEntityTable,
    TransactionTypeEnum
} from '@budgie/contracts';
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
const CONVERSION_FAILURE_MESSAGE = 'conversion failed';

const seedPrivatbankCard = (cardEnding: string): AccountEntityInterface =>
    seed.account({
        title: `Privatbank •${cardEnding}`,
        type: AccountTypeEnum.BANK_SYNC,
        externalSource: ExternalSourceEnum.PRIVATBANK,
        externalId: `4000 **** **** ${cardEnding}`,
        iban: `UA00PRIVATBANK${cardEnding}`
    });

const archiveAccount = (accountId: number): void => {
    testDb.update(AccountEntityTable).set({ deletedAt: new Date() }).where(eq(AccountEntityTable.id, accountId)).run();
};

const seedOwnCardIncome = (accountId: number, title: string = OWN_CARD_INCOME_TITLE): TransactionEntityInterface => {
    const income = seed.bankPairIncome(
        { externalId: 'privatbank-own-card-income', operatedAt: OWN_CARD_OPERATED_AT },
        { accountId, amount: OWN_CARD_AMOUNT }
    );

    return seed.updateTransaction(income.id, { externalSource: ExternalSourceEnum.PRIVATBANK, title });
};

const softDeleteTransaction = (transactionId: number): void => {
    const deletedAt = new Date();

    testDb.update(TransactionEntityTable).set({ deletedAt }).where(eq(TransactionEntityTable.id, transactionId)).run();
    testDb.update(TransactionEntryEntityTable).set({ deletedAt }).where(eq(TransactionEntryEntityTable.transactionId, transactionId)).run();
};

const seedOwnCardCounterpartExpense = (accountId: number): TransactionEntityInterface => {
    const expense = seed.bankPairExpense(
        { externalId: 'privatbank-own-card-expense', operatedAt: OWN_CARD_OPERATED_AT },
        { accountId, amount: OWN_CARD_AMOUNT }
    );

    return seed.updateTransaction(expense.id, { externalSource: ExternalSourceEnum.PRIVATBANK, title: OWN_CARD_EXPENSE_TITLE });
};

const seedArchivedOwnCardScenario = (): {
    readonly archivedCard: AccountEntityInterface;
    readonly income: TransactionEntityInterface;
    readonly liveCard: AccountEntityInterface;
} => {
    const liveCard = seedPrivatbankCard('1234');
    const archivedCard = seedPrivatbankCard('4321');
    const income = seedOwnCardIncome(liveCard.id);

    archiveAccount(archivedCard.id);

    return { archivedCard, income, liveCard };
};

const seedArchivedCardWithMask = (externalId: string | null, iban: string): AccountEntityInterface => {
    const archivedCard = seed.account({
        title: 'Privatbank •4321',
        type: AccountTypeEnum.BANK_SYNC,
        externalSource: ExternalSourceEnum.PRIVATBANK,
        externalId,
        iban
    });

    archiveAccount(archivedCard.id);

    return archivedCard;
};

const expectRepairedFromCounterpart = Effect.fnUntraced(function* (
    archivedCard: AccountEntityInterface,
    income: TransactionEntityInterface
) {
    const unpairedOwnCardTransferRepairService = yield* UnpairedOwnCardTransferRepairService;

    expect(yield* unpairedOwnCardTransferRepairService.countCandidates()).toBe(1);
    expect(yield* unpairedOwnCardTransferRepairService.repair()).toBe(1);
    expect(fetchTransactionById(income.id).fromAccountId).toBe(archivedCard.id);
});

describe('privatbank/own-card-transfer-repair', () => {
    it.effect('repairs an own-card income whose counterpart card account was archived', () =>
        Effect.gen(function* () {
            const unpairedOwnCardTransferRepairService = yield* UnpairedOwnCardTransferRepairService;
            const { archivedCard, income, liveCard } = seedArchivedOwnCardScenario();

            expect(yield* unpairedOwnCardTransferRepairService.countCandidates()).toBe(1);
            expect(yield* unpairedOwnCardTransferRepairService.repair()).toBe(1);

            const repaired = fetchTransactionById(income.id);

            expect(repaired.type).toBe(TransactionTypeEnum.TRANSFER);
            expect(repaired.fromAccountId).toBe(archivedCard.id);
            expect(repaired.toAccountId).toBe(liveCard.id);
        }).pipe(Effect.provide(TestLayer))
    );

    it.effect('leaves nothing to repair after a first repair pass', () =>
        Effect.gen(function* () {
            const unpairedOwnCardTransferRepairService = yield* UnpairedOwnCardTransferRepairService;
            seedArchivedOwnCardScenario();

            yield* unpairedOwnCardTransferRepairService.repair();

            expect(yield* unpairedOwnCardTransferRepairService.countCandidates()).toBe(0);
            expect(yield* unpairedOwnCardTransferRepairService.repair()).toBe(0);
        }).pipe(Effect.provide(TestLayer))
    );

    it.effect('counts an own-card income with a fee entry once', () =>
        Effect.gen(function* () {
            const unpairedOwnCardTransferRepairService = yield* UnpairedOwnCardTransferRepairService;
            const liveCard = seedPrivatbankCard('1234');
            const archivedCard = seedPrivatbankCard('4321');
            const income = seedOwnCardIncome(liveCard.id);

            seed.feeEntry(income.id, 'privatbank-own-card-income-fee', { accountId: liveCard.id, amount: OWN_CARD_FEE_AMOUNT });
            archiveAccount(archivedCard.id);

            expect(yield* unpairedOwnCardTransferRepairService.countCandidates()).toBe(1);
            expect(yield* unpairedOwnCardTransferRepairService.repair()).toBe(1);
        }).pipe(Effect.provide(TestLayer))
    );

    it.effect('ignores a maskless third-party card transfer', () =>
        Effect.gen(function* () {
            const unpairedOwnCardTransferRepairService = yield* UnpairedOwnCardTransferRepairService;
            const liveCard = seedPrivatbankCard('1234');
            const archivedCard = seedPrivatbankCard('4321');
            const expense = seed.bankPairExpense(
                { externalId: 'privatbank-third-party-expense', operatedAt: OWN_CARD_OPERATED_AT },
                { accountId: liveCard.id, amount: OWN_CARD_AMOUNT }
            );

            seed.updateTransaction(expense.id, { externalSource: ExternalSourceEnum.PRIVATBANK, title: THIRD_PARTY_CARD_TITLE });
            archiveAccount(archivedCard.id);

            expect(yield* unpairedOwnCardTransferRepairService.countCandidates()).toBe(0);
        }).pipe(Effect.provide(TestLayer))
    );

    it.effect('repairs an own-card income whose counterpart leg was archived together with the card', () =>
        Effect.gen(function* () {
            const liveCard = seedPrivatbankCard('1234');
            const archivedCard = seedPrivatbankCard('4321');
            const income = seedOwnCardIncome(liveCard.id);

            softDeleteTransaction(seedOwnCardCounterpartExpense(archivedCard.id).id);
            archiveAccount(archivedCard.id);

            yield* expectRepairedFromCounterpart(archivedCard, income);
        }).pipe(Effect.provide(TestLayer))
    );

    it.effect('ignores an own-card income whose card mask resolves to no archived account', () =>
        Effect.gen(function* () {
            const unpairedOwnCardTransferRepairService = yield* UnpairedOwnCardTransferRepairService;
            const liveCard = seedPrivatbankCard('1234');
            const archivedCard = seedPrivatbankCard('4321');

            seedOwnCardIncome(liveCard.id, UNKNOWN_CARD_INCOME_TITLE);
            archiveAccount(archivedCard.id);

            expect(yield* unpairedOwnCardTransferRepairService.countCandidates()).toBe(0);
        }).pipe(Effect.provide(TestLayer))
    );

    it.effect('rejects when a candidate conversion fails', () =>
        Effect.gen(function* () {
            const unpairedOwnCardTransferRepairService = yield* UnpairedOwnCardTransferRepairService;
            const transactionTransferService = yield* TransactionTransferService;
            seedArchivedOwnCardScenario();

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
            const liveCard = seedPrivatbankCard('1234');
            const archivedCard = seedPrivatbankCard('4321');

            seedOwnCardIncome(liveCard.id);
            seedOwnCardCounterpartExpense(archivedCard.id);
            archiveAccount(archivedCard.id);

            expect(yield* unpairedOwnCardTransferRepairService.countCandidates()).toBe(0);
        }).pipe(Effect.provide(TestLayer))
    );

    it.effect('matches the counterpart card by external_id when its IBAN suffix differs', () =>
        Effect.gen(function* () {
            const liveCard = seedPrivatbankCard('1234');
            const archivedCard = seedArchivedCardWithMask('4000 **** **** 4321', 'UA00PRIVATBANK9999');
            const income = seedOwnCardIncome(liveCard.id);

            yield* expectRepairedFromCounterpart(archivedCard, income);
        }).pipe(Effect.provide(TestLayer))
    );

    it.effect('falls back to the IBAN suffix when the counterpart card has no external_id', () =>
        Effect.gen(function* () {
            const liveCard = seedPrivatbankCard('1234');
            const archivedCard = seedArchivedCardWithMask(null, 'UA00PRIVATBANK4321');
            const income = seedOwnCardIncome(liveCard.id);

            yield* expectRepairedFromCounterpart(archivedCard, income);
        }).pipe(Effect.provide(TestLayer))
    );

    it.effect('deletes the superseded counterpart leg so restoring the archived card does not double count it', () =>
        Effect.gen(function* () {
            const unpairedOwnCardTransferRepairService = yield* UnpairedOwnCardTransferRepairService;
            const accountArchiveService = yield* AccountArchiveService;
            const liveCard = seedPrivatbankCard('1234');
            const archivedCard = seedPrivatbankCard('4321');
            const income = seedOwnCardIncome(liveCard.id);
            const supersededExpense = seedOwnCardCounterpartExpense(archivedCard.id);

            softDeleteTransaction(supersededExpense.id);
            archiveAccount(archivedCard.id);

            expect(yield* unpairedOwnCardTransferRepairService.repair()).toBe(1);
            expect(fetchTransactionById(supersededExpense.id)).toBeUndefined();

            yield* accountArchiveService.restoreById(archivedCard.id);

            const liveExpensesOnArchivedCard = testDb
                .select()
                .from(TransactionEntityTable)
                .where(
                    and(
                        eq(TransactionEntityTable.type, TransactionTypeEnum.EXPENSE),
                        eq(TransactionEntityTable.fromAccountId, archivedCard.id),
                        isNull(TransactionEntityTable.deletedAt)
                    )
                )
                .all();

            expect(liveExpensesOnArchivedCard).toHaveLength(0);
            expect(fetchTransactionById(income.id).type).toBe(TransactionTypeEnum.TRANSFER);
        }).pipe(Effect.provide(TestLayer))
    );

    it.effect('deletes only the nearest superseded counterpart leg when several qualify', () =>
        Effect.gen(function* () {
            const unpairedOwnCardTransferRepairService = yield* UnpairedOwnCardTransferRepairService;
            const liveCard = seedPrivatbankCard('1234');
            const archivedCard = seedPrivatbankCard('4321');

            seedOwnCardIncome(liveCard.id);

            const farExpense = seed.updateTransaction(
                seed.bankPairExpense(
                    { externalId: 'privatbank-far-expense', operatedAt: new Date(OWN_CARD_OPERATED_AT.getTime() + 60_000) },
                    { accountId: archivedCard.id, amount: OWN_CARD_AMOUNT }
                ).id,
                { externalSource: ExternalSourceEnum.PRIVATBANK, title: OWN_CARD_EXPENSE_TITLE }
            );
            const nearExpense = seedOwnCardCounterpartExpense(archivedCard.id);

            softDeleteTransaction(farExpense.id);
            softDeleteTransaction(nearExpense.id);
            archiveAccount(archivedCard.id);

            expect(yield* unpairedOwnCardTransferRepairService.repair()).toBe(1);
            expect(fetchTransactionById(nearExpense.id)).toBeUndefined();
            expect(fetchTransactionById(farExpense.id)).toBeDefined();
        }).pipe(Effect.provide(TestLayer))
    );

    it.effect('keeps the archived counterpart balance at 0 after the repair leaves a live transfer leg on it', () =>
        Effect.gen(function* () {
            const unpairedOwnCardTransferRepairService = yield* UnpairedOwnCardTransferRepairService;
            const accountBalanceRepository = yield* AccountBalanceRepository;
            const { archivedCard } = seedArchivedOwnCardScenario();

            yield* unpairedOwnCardTransferRepairService.repair();

            const archivedBalanceRow = (yield* accountBalanceRepository.getArchivedAccountBalance(archivedCard.id)).at(0);

            expect(archivedBalanceRow?.balance).toBe(0);
        }).pipe(Effect.provide(TestLayer))
    );
});
