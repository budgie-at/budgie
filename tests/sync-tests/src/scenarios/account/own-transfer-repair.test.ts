import {
    AccountBalanceRepository,
    AccountEntityTable,
    TransactionEntryTypeEnum,
    TRANSFER_PAIR_TIME_WINDOW_SECONDS,
    ExternalSourceEnum,
    InstrumentTypeEnum,
    TransactionConsolidationTypeEnum,
    TransactionEntityTable,
    TransactionTypeEnum,
    TransactionUpdatedByEnum
} from '@budgie/contracts';
import { AccountBalanceIncrementalService } from '@budgie/ledger';
import { OwnTransferRepairService } from '@budgie/sync';
import { describe, expect, it } from '@effect/vitest';
import { eq } from 'drizzle-orm';
import * as Effect from 'effect/Effect';

import { isDefined } from '@rnw-community/shared';

import { ownTransferDetector } from '../../../../../packages/sync/src/core/detector/own-transfer.detector';
import { OwnTransferRepository } from '../../../../../packages/sync/src/core/repository/own-transfer.repository';
import { explainQueryPlan, seed, testDb, TestLayer, testQueryService } from '../../harness';

const operatedAt = new Date('2026-05-01T12:00:00Z');
const fixture = Effect.gen(function* () {
    const repair = yield* OwnTransferRepairService;
    const integration = yield* seed.bankIntegration({ provider: ExternalSourceEnum.MONOBANK, label: 'Коваленко Олена' });
    const source = yield* seed.account();
    const target = yield* seed.account({ externalId: 'fixture-mono-id', title: 'Monobank Black •2468' });
    yield* testDb.update(AccountEntityTable).set({ integrationId: integration.id }).where(eq(AccountEntityTable.id, target.id));
    const expense = yield* seed.bankPairExpense({ operatedAt, externalId: 'outgoing' }, { accountId: source.id, amount: 50_000_000 });
    yield* seed.updateTransaction(expense.id, { title: 'Зі своєї картки *2468', externalSource: ExternalSourceEnum.MONOBANK });

    return { repair, source, target, expense, integration };
});
const addIncome = (accountId: number) =>
    Effect.gen(function* () {
        const income = yield* seed.bankPairIncome({ operatedAt, externalId: 'incoming' }, { accountId, amount: 50_000_000 });
        yield* seed.updateTransaction(income.id, { externalSource: ExternalSourceEnum.MONOBANK });

        return income;
    });
const findUntrackedAccounts = testDb.query.AccountEntityTable.findMany({ where: { externalId: 'untracked-own-account' } });
const expectUntrackedTransfer = (transactionId: number, accountId: number) =>
    Effect.gen(function* () {
        const [untracked] = yield* findUntrackedAccounts;
        const transaction = yield* testQueryService.findTransactionById(transactionId);
        expect(transaction.type).toBe(TransactionTypeEnum.TRANSFER);
        expect([transaction.fromAccountId, transaction.toAccountId]).toEqual(expect.arrayContaining([accountId, untracked.id]));
    });
const expectExpense = (transactionId: number) =>
    Effect.gen(function* () {
        const transaction = yield* testQueryService.findTransactionById(transactionId);
        expect(transaction.type).toBe(TransactionTypeEnum.EXPENSE);
        expect(transaction.consolidationParentTransactionId).toBeNull();
    });
const expectUnpaired = (expenseId: number, incomeId: number) =>
    Effect.gen(function* () {
        const repair = yield* OwnTransferRepairService;
        expect(yield* repair.repair()).toBe(0);
        yield* expectExpense(expenseId);
        expect((yield* testQueryService.findTransactionById(incomeId)).type).toBe(TransactionTypeEnum.INCOME);
    });
const expectPair = (expenseId: number, incomeId: number, sourceId: number, targetId: number) =>
    Effect.gen(function* () {
        const [canonical] = yield* testQueryService.fetchCanonicalsOfType(TransactionConsolidationTypeEnum.TRANSFER_PAIR);
        expect(canonical.type).toBe(TransactionTypeEnum.TRANSFER);
        expect(canonical.fromAccountId).toBe(sourceId);
        expect(canonical.toAccountId).toBe(targetId);
        expect((yield* testQueryService.findTransactionById(expenseId)).consolidationParentTransactionId).toBe(canonical.id);
        expect((yield* testQueryService.findTransactionById(incomeId)).consolidationParentTransactionId).toBe(canonical.id);
    });

const repairAndExpectPair = (scenario: Effect.Success<typeof fixture>, incomeId: number) =>
    Effect.gen(function* () {
        expect(yield* scenario.repair.repair()).toBe(1);
        yield* expectPair(scenario.expense.id, incomeId, scenario.source.id, scenario.target.id);
    });

describe('account/own-transfer-repair', () => {
    it.effect('pairs an API-id account using the mask in its title', () =>
        Effect.gen(function* () {
            const { repair, source, target, expense } = yield* fixture;
            const income = yield* addIncome(target.id);
            const repository = yield* OwnTransferRepository;
            expect(yield* repository.findOpposites([expense.id])).toEqual([{ transactionId: expense.id, oppositeId: income.id }]);
            expect((yield* explainQueryPlan(repository.findOpposites([expense.id]))).some(step => step.includes('SEARCH'))).toBe(true);
            expect(yield* repair.repair()).toBe(1);
            yield* expectPair(expense.id, income.id, source.id, target.id);
            expect(yield* repair.repair()).toBe(0);
        }).pipe(Effect.provide([OwnTransferRepository.layer, TestLayer]))
    );

    it.effect('does not pair a fee amount with an income', () =>
        Effect.gen(function* () {
            const { source, target, expense } = yield* fixture;
            yield* seed.feeEntry(expense.id, 'fee', { accountId: source.id, amount: 500_000 });
            const income = yield* seed.bankPairIncome(
                { operatedAt, externalId: 'small-income' },
                { accountId: target.id, amount: 500_000 }
            );
            yield* seed.updateTransaction(income.id, { externalSource: ExternalSourceEnum.MONOBANK });
            yield* expectUnpaired(expense.id, income.id);
        }).pipe(Effect.provide(TestLayer))
    );

    it.effect('pairs the principal and preserves the fee and ledger balances', () =>
        Effect.gen(function* () {
            const { repair, source, target, expense } = yield* fixture;
            yield* seed.feeEntry(expense.id, 'fee', { accountId: source.id, amount: 500_000 });
            const income = yield* addIncome(target.id);
            const balances = yield* AccountBalanceRepository;
            const before = yield* balances.getLedgerBalances([source.id, target.id]);
            expect(yield* repair.repair()).toBe(1);
            yield* expectPair(expense.id, income.id, source.id, target.id);
            expect(yield* balances.getLedgerBalances([source.id, target.id])).toEqual(before);
            const [canonical] = yield* testQueryService.fetchCanonicalsOfType(TransactionConsolidationTypeEnum.TRANSFER_PAIR);
            expect(
                (yield* testQueryService.fetchEntriesByTransactionId(canonical.id))
                    .filter(entry => entry.type === TransactionEntryTypeEnum.FEE && !isDefined(entry.originalTransactionId))
                    .map(entry => entry.amount)
            ).toEqual([500_000]);
        }).pipe(Effect.provide(TestLayer))
    );

    it.effect('rejects an opposite on a different account from the explicit card', () =>
        Effect.gen(function* () {
            const { expense } = yield* fixture;
            yield* seed.updateTransaction(expense.id, { title: '*2468' });
            const other = yield* seed.account();
            const income = yield* addIncome(other.id);
            yield* expectUnpaired(expense.id, income.id);
        }).pipe(Effect.provide(TestLayer))
    );

    it.effect('rejects an opposite whose card mask identifies a third account', () =>
        Effect.gen(function* () {
            const { target, expense } = yield* fixture;
            yield* seed.updateTransaction(expense.id, { title: 'На свою картку' });
            yield* seed.account({ title: 'Third •1357' });
            const income = yield* addIncome(target.id);
            yield* seed.updateTransaction(income.id, { title: 'З картки *1357' });
            yield* expectUnpaired(expense.id, income.id);
        }).pipe(Effect.provide(TestLayer))
    );

    it.effect('pairs a phrase when the opposite card mask identifies the source', () =>
        Effect.gen(function* () {
            const scenario = yield* fixture;
            yield* seed.updateTransaction(scenario.expense.id, { title: 'На свою картку' });
            yield* testDb.update(AccountEntityTable).set({ title: 'Source •9753' }).where(eq(AccountEntityTable.id, scenario.source.id));
            const income = yield* addIncome(scenario.target.id);
            yield* seed.updateTransaction(income.id, { title: 'З картки *9753' });
            yield* repairAndExpectPair(scenario, income.id);
        }).pipe(Effect.provide(TestLayer))
    );

    it.effect('does not convert into a released external account without an opposite', () =>
        Effect.gen(function* () {
            const scenario = yield* fixture;
            yield* testDb
                .update(AccountEntityTable)
                .set({ integrationId: null, externalSource: ExternalSourceEnum.PRIVATBANK })
                .where(eq(AccountEntityTable.id, scenario.target.id));
            expect(yield* scenario.repair.repair()).toBe(0);
            yield* expectExpense(scenario.expense.id);
        }).pipe(Effect.provide(TestLayer))
    );

    it.effect('uses the unique opposite to disambiguate two matching cards', () =>
        Effect.gen(function* () {
            const scenario = yield* fixture;
            yield* seed.account({ title: 'Another card •2468' });
            const income = yield* addIncome(scenario.target.id);
            yield* repairAndExpectPair(scenario, income.id);
        }).pipe(Effect.provide(TestLayer))
    );

    it.effect('pairs an income-side own-card candidate in the correct direction', () =>
        Effect.gen(function* () {
            const scenario = yield* fixture;
            yield* seed.updateTransaction(scenario.expense.id, { title: 'Bank payment' });
            yield* testDb.update(AccountEntityTable).set({ title: 'Source •2468' }).where(eq(AccountEntityTable.id, scenario.source.id));
            const income = yield* addIncome(scenario.target.id);
            yield* seed.updateTransaction(income.id, { title: 'Зі своєї картки *2468' });
            yield* repairAndExpectPair(scenario, income.id);
        }).pipe(Effect.provide(TestLayer))
    );

    it.effect('re-pairs an abbreviated identity fallback once a unique opposite arrives', () =>
        Effect.gen(function* () {
            const scenario = yield* fixture;
            yield* seed.updateTransaction(scenario.expense.id, { title: 'Олена К.' });
            expect(yield* scenario.repair.repair()).toBe(1);
            yield* expectUntrackedTransfer(scenario.expense.id, scenario.source.id);
            const income = yield* addIncome(scenario.target.id);
            yield* repairAndExpectPair(scenario, income.id);
        }).pipe(Effect.provide(TestLayer))
    );

    it.effect('converts a manual card target despite an unrelated foreign-currency income', () =>
        Effect.gen(function* () {
            const { repair, source, target, expense } = yield* fixture;
            yield* testDb
                .update(AccountEntityTable)
                .set({ integrationId: null, externalSource: null })
                .where(eq(AccountEntityTable.id, target.id));
            const instrument = yield* seed.instrument({ code: 'USD' });
            const unrelated = yield* seed.account({ instrumentId: instrument.id });
            const income = yield* addIncome(unrelated.id);
            yield* seed.updateTransaction(income.id, { title: 'Salary' });
            expect(yield* repair.repair()).toBe(1);
            const transaction = yield* testQueryService.findTransactionById(expense.id);
            expect(transaction.type).toBe(TransactionTypeEnum.TRANSFER);
            expect(transaction.fromAccountId).toBe(source.id);
            expect(transaction.toAccountId).toBe(target.id);
            expect((yield* testQueryService.findTransactionById(income.id)).type).toBe(TransactionTypeEnum.INCOME);
        }).pipe(Effect.provide(TestLayer))
    );

    it.effect('does not convert a manual target in another instrument', () =>
        Effect.gen(function* () {
            const { repair, target, expense } = yield* fixture;
            const instrument = yield* seed.instrument({ code: 'USD' });
            yield* testDb
                .update(AccountEntityTable)
                .set({ integrationId: null, instrumentId: instrument.id })
                .where(eq(AccountEntityTable.id, target.id));
            expect(yield* repair.repair()).toBe(0);
            yield* expectExpense(expense.id);
        }).pipe(Effect.provide(TestLayer))
    );

    it.effect('leaves a synced card without its opposite unchanged and creates no account', () =>
        Effect.gen(function* () {
            const { repair, expense } = yield* fixture;
            expect(yield* repair.repair()).toBe(0);
            yield* expectExpense(expense.id);
            expect(yield* findUntrackedAccounts).toEqual([]);
        }).pipe(Effect.provide(TestLayer))
    );

    it.effect('pairs two Monobank cards when their legs arrive in separate scoped repairs', () =>
        Effect.gen(function* () {
            const { repair, source, target, expense, integration } = yield* fixture;
            const balances = yield* AccountBalanceRepository;
            yield* testDb
                .update(AccountEntityTable)
                .set({ integrationId: integration.id, externalSource: ExternalSourceEnum.MONOBANK, externalId: 'source-mono-id' })
                .where(eq(AccountEntityTable.id, source.id));
            yield* testDb
                .update(AccountEntityTable)
                .set({ externalSource: ExternalSourceEnum.MONOBANK })
                .where(eq(AccountEntityTable.id, target.id));
            yield* seed.updateTransaction(expense.id, { title: 'На свою картку' });
            expect(yield* repair.repair({ operatedAtFrom: operatedAt, operatedAtTo: operatedAt, transactionIds: [expense.id] })).toBe(1);
            yield* expectUntrackedTransfer(expense.id, source.id);
            const [untracked] = yield* findUntrackedAccounts;
            expect((yield* balances.getByAccountIds([untracked.id])).map(balance => balance.amount)).toEqual([50_000_000]);
            const income = yield* addIncome(target.id);
            expect(yield* repair.repair({ operatedAtFrom: operatedAt, operatedAtTo: operatedAt, transactionIds: [income.id] })).toBe(1);
            yield* expectPair(expense.id, income.id, source.id, target.id);
            expect(yield* testQueryService.fetchCanonicalsOfType(TransactionConsolidationTypeEnum.TRANSFER_PAIR)).toHaveLength(1);
            expect(
                yield* testDb.query.TransactionEntryEntityTable.findMany({
                    where: { accountId: untracked.id, originalTransactionId: { isNull: true }, deletedAt: { isNull: true } }
                })
            ).toEqual([]);
            expect(
                yield* testDb.query.TransactionEntityTable.findMany({
                    where: {
                        OR: [{ fromAccountId: untracked.id }, { toAccountId: untracked.id }],
                        consolidationParentTransactionId: { isNull: true },
                        deletedAt: { isNull: true }
                    }
                })
            ).toEqual([]);
            expect((yield* balances.getByAccountIds([untracked.id])).map(balance => balance.amount)).toEqual([0]);
            expect((yield* balances.getLedgerBalances([untracked.id])).get(untracked.id) ?? 0).toBe(0);
            expect(yield* repair.repair()).toBe(0);
        }).pipe(Effect.provide(TestLayer))
    );

    it.effect.each(['untracked', 'fresh'])('does not re-pair with a competing %s movement outside the scope', competitorKind =>
        Effect.gen(function* () {
            const { repair, source, target, expense } = yield* fixture;
            const firstDate = new Date(operatedAt.getTime() - TRANSFER_PAIR_TIME_WINDOW_SECONDS * 1000);
            const competitorDate = new Date(operatedAt.getTime() + TRANSFER_PAIR_TIME_WINDOW_SECONDS * 1000);
            yield* seed.updateTransaction(expense.id, { title: 'На свою картку' });
            yield* testDb.update(TransactionEntityTable).set({ operatedAt: firstDate }).where(eq(TransactionEntityTable.id, expense.id));
            expect(yield* repair.repair()).toBe(1);
            const competitor = yield* seed.bankPairExpense(
                { operatedAt: competitorDate, externalId: 'competitor' },
                { accountId: source.id, amount: 50_000_000 }
            );
            yield* seed.updateTransaction(competitor.id, { title: 'На свою картку', externalSource: ExternalSourceEnum.MONOBANK });
            if (competitorKind === 'untracked') {
                expect(yield* repair.repair()).toBe(1);
            }
            const income = yield* addIncome(target.id);
            const balances = yield* AccountBalanceIncrementalService;
            yield* balances.updateBalancesByAccountIds([source.id, target.id]);
            expect(yield* repair.repair({ operatedAtFrom: firstDate, operatedAtTo: firstDate, transactionIds: [expense.id] })).toBe(0);
            yield* expectUntrackedTransfer(expense.id, source.id);
            expect((yield* testQueryService.findTransactionById(income.id)).type).toBe(TransactionTypeEnum.INCOME);
            expect(yield* testQueryService.fetchCanonicalsOfType(TransactionConsolidationTypeEnum.TRANSFER_PAIR)).toEqual([]);
            if (competitorKind === 'untracked') {
                yield* expectUntrackedTransfer(competitor.id, source.id);
            } else {
                yield* expectExpense(competitor.id);
            }
        }).pipe(Effect.provide(TestLayer))
    );

    it.effect.each([
        { title: 'fee-deducted', currency: 'UAH', received: 9_900_000, sent: 10_000_000 },
        { title: 'foreign-currency', currency: 'USD', received: 9_900_000, sent: 400_000_000 }
    ])('re-pairs a late $title bank expense with a converted Binance deposit', ({ currency, received, sent }) =>
        Effect.gen(function* () {
            const repair = yield* OwnTransferRepairService;
            const balances = yield* AccountBalanceRepository;
            const binance = yield* seed.account();
            const deposit = yield* seed.bankPairIncome({ operatedAt, externalId: 'deposit' }, { accountId: binance.id, amount: received });
            yield* seed.updateTransaction(deposit.id, { title: 'Binance UAH deposit', externalSource: ExternalSourceEnum.BINANCE });
            expect(yield* repair.repair()).toBe(1);
            const [untracked] = yield* findUntrackedAccounts;
            const instrument = yield* seed.instrument({ code: currency });
            const bank = yield* seed.account({ instrumentId: currency === 'UAH' ? binance.instrumentId : instrument.id });
            const expense = yield* seed.bankPairExpense({ operatedAt, externalId: 'late-expense' }, { accountId: bank.id, amount: sent });
            yield* seed.updateTransaction(expense.id, { title: 'На свою картку', externalSource: ExternalSourceEnum.MONOBANK });
            const before = yield* balances.getLedgerBalances([binance.id, bank.id]);
            expect(yield* repair.repair()).toBe(1);
            yield* expectPair(expense.id, deposit.id, bank.id, binance.id);
            const [canonical] = yield* testQueryService.fetchCanonicalsOfType(TransactionConsolidationTypeEnum.TRANSFER_PAIR);
            const entries = (yield* testQueryService.fetchEntriesByTransactionId(canonical.id)).filter(
                entry => !isDefined(entry.originalTransactionId)
            );
            expect(entries.find(entry => entry.accountId === bank.id && entry.type === TransactionEntryTypeEnum.CREDIT)?.amount).toBe(sent);
            expect(entries.find(entry => entry.accountId === binance.id && entry.type === TransactionEntryTypeEnum.DEBIT)?.amount).toBe(
                received
            );
            expect(canonical.exchangeRate).toBe(sent / received);
            expect(yield* balances.getLedgerBalances([binance.id, bank.id])).toEqual(before);
            expect((yield* balances.getByAccountIds([untracked.id])).map(balance => balance.amount)).toEqual([0]);
            expect((yield* balances.getLedgerBalances([untracked.id])).get(untracked.id) ?? 0).toBe(0);
            expect(yield* findUntrackedAccounts).toHaveLength(1);
        }).pipe(Effect.provide(TestLayer))
    );

    it.effect('restores reserved account flags even with no scoped candidates', () =>
        Effect.gen(function* () {
            const { repair, expense } = yield* fixture;
            yield* seed.updateTransaction(expense.id, { title: 'На свою картку' });
            expect(yield* repair.repair()).toBe(1);
            const [untracked] = yield* findUntrackedAccounts;
            yield* testDb
                .update(AccountEntityTable)
                .set({ isActive: true, includeInNetWorth: true })
                .where(eq(AccountEntityTable.id, untracked.id));
            const emptyDate = new Date(operatedAt.getTime() + 86_400_000);
            expect(yield* repair.repair({ operatedAtFrom: emptyDate, operatedAtTo: emptyDate, transactionIds: [] })).toBe(0);
            expect(yield* findUntrackedAccounts).toEqual([
                expect.objectContaining({ id: untracked.id, isActive: false, includeInNetWorth: false })
            ]);
        }).pipe(Effect.provide(TestLayer))
    );

    it.effect('ignores an unrelated purchase when converting an own deposit', () =>
        Effect.gen(function* () {
            const { repair, expense, target } = yield* fixture;
            yield* seed.updateTransaction(expense.id, { title: 'Groceries' });
            const deposit = yield* seed.bankPairIncome({ operatedAt, externalId: 'deposit' }, { accountId: target.id, amount: 9_900_000 });
            yield* seed.updateTransaction(deposit.id, { title: 'Binance UAH deposit', externalSource: ExternalSourceEnum.BINANCE });
            expect(yield* repair.repair()).toBe(1);
            yield* expectUntrackedTransfer(deposit.id, target.id);
            yield* expectExpense(expense.id);
        }).pipe(Effect.provide(TestLayer))
    );

    it.effect('preserves a phrase with two matching card targets', () =>
        Effect.gen(function* () {
            const { repair, expense } = yield* fixture;
            yield* seed.account({ title: 'Another card •2468' });
            expect(yield* repair.repair()).toBe(0);
            yield* expectExpense(expense.id);
        }).pipe(Effect.provide(TestLayer))
    );

    it.effect('preserves two expenses competing for one eligible income', () =>
        Effect.gen(function* () {
            const { repair, source, target, expense } = yield* fixture;
            const duplicate = yield* seed.bankPairExpense(
                { operatedAt, externalId: 'duplicate' },
                { accountId: source.id, amount: 50_000_000 }
            );
            yield* seed.updateTransaction(duplicate.id, { title: 'На свою картку', externalSource: ExternalSourceEnum.MONOBANK });
            const income = yield* addIncome(target.id);
            expect(yield* repair.repair()).toBe(0);
            yield* expectExpense(expense.id);
            yield* expectExpense(duplicate.id);
            expect((yield* testQueryService.findTransactionById(income.id)).type).toBe(TransactionTypeEnum.INCOME);
        }).pipe(Effect.provide(TestLayer))
    );

    it.effect('does not convert into a manual account with an existing manual opposite', () =>
        Effect.gen(function* () {
            const { target, expense } = yield* fixture;
            yield* testDb.update(AccountEntityTable).set({ integrationId: null }).where(eq(AccountEntityTable.id, target.id));
            const income = yield* addIncome(target.id);
            yield* testDb.update(TransactionEntityTable).set({ externalSource: null }).where(eq(TransactionEntityTable.id, income.id));
            yield* expectUnpaired(expense.id, income.id);
        }).pipe(Effect.provide(TestLayer))
    );

    it.effect('preserves a user-edited opposite', () =>
        Effect.gen(function* () {
            const { target, expense } = yield* fixture;
            const income = yield* addIncome(target.id);
            yield* testDb
                .update(TransactionEntityTable)
                .set({ updatedBy: TransactionUpdatedByEnum.USER })
                .where(eq(TransactionEntityTable.id, income.id));
            yield* expectUnpaired(expense.id, income.id);
        }).pipe(Effect.provide(TestLayer))
    );

    it.effect('converts a unique manual card without an opposite exactly once', () =>
        Effect.gen(function* () {
            const { repair, source, target, expense } = yield* fixture;
            yield* testDb.update(AccountEntityTable).set({ integrationId: null }).where(eq(AccountEntityTable.id, target.id));
            expect(yield* repair.repair()).toBe(1);
            const result = yield* testQueryService.findTransactionById(expense.id);
            expect(result.type).toBe(TransactionTypeEnum.TRANSFER);
            expect(result.fromAccountId).toBe(source.id);
            expect(result.toAccountId).toBe(target.id);
            expect(yield* repair.repair()).toBe(0);
        }).pipe(Effect.provide(TestLayer))
    );

    it.effect('uses Binance titles only for pairing', () =>
        Effect.gen(function* () {
            const { repair, source, target, expense } = yield* fixture;
            yield* seed.updateTransaction(expense.id, { title: 'Binance USDT withdrawal', externalSource: ExternalSourceEnum.BINANCE });
            expect(yield* repair.repair()).toBe(0);
            yield* expectExpense(expense.id);
            const income = yield* addIncome(target.id);
            expect(yield* repair.repair()).toBe(1);
            yield* expectPair(expense.id, income.id, source.id, target.id);
        }).pipe(Effect.provide(TestLayer))
    );

    it.effect('converts an unmatched own movement to the untracked account exactly once', () =>
        Effect.gen(function* () {
            const { repair, source, expense } = yield* fixture;
            yield* seed.updateTransaction(expense.id, { title: 'Олена Коваленко' });
            expect(yield* repair.repair()).toBe(1);
            yield* expectUntrackedTransfer(expense.id, source.id);
            expect(yield* repair.repair()).toBe(0);
        }).pipe(Effect.provide(TestLayer))
    );

    it.effect('converts only a Binance fiat deposit without a counterpart', () =>
        Effect.gen(function* () {
            const repair = yield* OwnTransferRepairService;
            const fiat = yield* seed.account();
            const bitcoin = yield* seed.instrument({ code: 'BTC', name: 'Bitcoin', symbol: 'BTC', type: InstrumentTypeEnum.CRYPTO });
            const crypto = yield* seed.account({ instrumentId: bitcoin.id });
            const cryptoOperatedAt = new Date(operatedAt.getTime() + 86_400_000);
            const seedMovement = (accountId: number, type: TransactionTypeEnum, title: string, amount: number) =>
                Effect.gen(function* () {
                    const movementOperatedAt = accountId === crypto.id ? cryptoOperatedAt : operatedAt;
                    const transaction =
                        type === TransactionTypeEnum.INCOME
                            ? yield* seed.bankPairIncome({ operatedAt: movementOperatedAt, externalId: title }, { accountId, amount })
                            : yield* seed.bankPairExpense({ operatedAt: movementOperatedAt, externalId: title }, { accountId, amount });
                    yield* seed.updateTransaction(transaction.id, { title, externalSource: ExternalSourceEnum.BINANCE });

                    return transaction;
                });
            const fiatDeposit = yield* seedMovement(fiat.id, TransactionTypeEnum.INCOME, 'Binance UAH deposit', 10_000_000);
            const fiatWithdrawal = yield* seedMovement(fiat.id, TransactionTypeEnum.EXPENSE, 'Binance UAH withdrawal', 20_000_000);
            const cryptoDeposit = yield* seedMovement(crypto.id, TransactionTypeEnum.INCOME, 'Binance BTC deposit', 30_000_000);
            const cryptoWithdrawal = yield* seedMovement(crypto.id, TransactionTypeEnum.EXPENSE, 'Binance BTC withdrawal', 40_000_000);
            expect(yield* repair.repair()).toBe(1);
            yield* expectUntrackedTransfer(fiatDeposit.id, fiat.id);
            yield* expectExpense(fiatWithdrawal.id);
            yield* expectExpense(cryptoWithdrawal.id);
            expect((yield* testQueryService.findTransactionById(cryptoDeposit.id)).type).toBe(TransactionTypeEnum.INCOME);
        }).pipe(Effect.provide(TestLayer))
    );

    it.effect('does not convert a fee-deducted Binance fiat deposit with a bank expense in the window', () =>
        Effect.gen(function* () {
            const repair = yield* OwnTransferRepairService;
            const binance = yield* seed.account();
            const bank = yield* seed.account();
            const deposit = yield* seed.bankPairIncome(
                { operatedAt, externalId: 'binance-deposit' },
                { accountId: binance.id, amount: 9_900_000 }
            );
            yield* seed.updateTransaction(deposit.id, { title: 'Binance UAH deposit', externalSource: ExternalSourceEnum.BINANCE });
            const expense = yield* seed.bankPairExpense(
                { operatedAt, externalId: 'bank-expense' },
                { accountId: bank.id, amount: 10_000_000 }
            );
            yield* seed.updateTransaction(expense.id, { title: 'Binance', externalSource: ExternalSourceEnum.MONOBANK });
            expect(yield* repair.repair()).toBe(0);
            expect((yield* testQueryService.findTransactionById(deposit.id)).type).toBe(TransactionTypeEnum.INCOME);
            yield* expectExpense(expense.id);
            expect(yield* findUntrackedAccounts).toEqual([]);
        }).pipe(Effect.provide(TestLayer))
    );

    it.effect('does not convert an own movement with an opposite leg in another instrument', () =>
        Effect.gen(function* () {
            const { expense } = yield* fixture;
            yield* seed.updateTransaction(expense.id, { title: 'Олена Коваленко' });
            const dollar = yield* seed.instrument({ code: 'USD' });
            const dollarAccount = yield* seed.account({ instrumentId: dollar.id });
            const income = yield* seed.bankPairIncome(
                { operatedAt, externalId: 'dollar-income' },
                { accountId: dollarAccount.id, amount: 1_200_000 }
            );
            yield* seed.updateTransaction(income.id, { title: 'На свою картку', externalSource: ExternalSourceEnum.MONOBANK });
            yield* expectUnpaired(expense.id, income.id);
            expect(yield* findUntrackedAccounts).toEqual([]);
        }).pipe(Effect.provide(TestLayer))
    );
});

describe('own transfer detector', () => {
    it('rejects an alphanumeric payment identifier as a card suffix', () => {
        expect(ownTransferDetector.matchesAccount('PAYPAL *1234ABCD', { externalId: null, title: 'Visa •1234' })).toBe(false);
    });
    it.each(['400000****2468', '*2468', '****2468', '•2468', 'Зі своєї картки *2468'])('matches the account title mask for %s', title => {
        expect(ownTransferDetector.matchesAccount(title, { externalId: 'fixture-mono-id', title: 'Monobank Black •2468' })).toBe(true);
    });
    it.each([
        'Олена Коваленко',
        'Kovalenko Olena',
        'own card *9999',
        'Зі своєї картки *9999',
        'propre compte',
        'eigenes Konto',
        'cuenta propia',
        'Відкриття депозиту',
        'deposit closing',
        'P24 *Kovalenko Olena'
    ])('recognizes own movement signal %s', title => {
        expect(ownTransferDetector.matches(title, ['Коваленко Олена'])).toBe(true);
    });
    it.each(['Amy Cardenas', 'Tommy Card Shop', 'Brown Accountants', 'Top up my card Uber', 'Tax 2024'])(
        'rejects unrelated title %s',
        title => {
            expect(ownTransferDetector.matches(title, ['Коваленко Олена'])).toBe(false);
            expect(ownTransferDetector.matchesAbbreviatedName(title, ['Коваленко Олена'])).toBe(false);
        }
    );
});
