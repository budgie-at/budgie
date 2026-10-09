import {
    AccountBalanceRepository,
    AccountDebtTypeEnum,
    AccountEntityTable,
    AccountTypeEnum,
    CurrencyEnum,
    ExternalSourceEnum,
    PRECISION,
    TransactionEntityTable,
    TransactionEntryEntityTable,
    TransactionEntryTypeEnum,
    TransactionTypeEnum,
    UserIconNameEnum
} from '@budgie/contracts';
import { DepositReceivingAmountMismatchError, TransactionTransferService } from '@budgie/ledger';
import { describe, expect, it } from '@effect/vitest';
import { eq } from 'drizzle-orm';
import * as Effect from 'effect/Effect';
import * as Exit from 'effect/Exit';

import {
    buildMonobank,
    fetchExpenseEntries,
    fetchTransactionById,
    monobankStub,
    MonobankSyncService,
    requireInstrument,
    seed,
    setupMonobankFixture,
    testDb,
    TestLayer
} from '../../harness';

import type { StartDepositInputInterface } from '@budgie/ledger';

const EUR_NUMERIC_CODE = 978;
const UAH_NUMERIC_CODE = 980;
const FUNDING_AMOUNT = 45_000;
const EURO_OPERATION_AMOUNT = 1000;
const CASH_DEPOSIT_AMOUNT = 250;

const buildDepositInput = (instrumentId: number, receivingAmount: number): StartDepositInputInterface => ({
    title: 'Deposit',
    icon: UserIconNameEnum.Landmark,
    instrumentId,
    interestRate: null,
    deadline: null,
    includeInNetWorth: true,
    receivingAmount
});

const syncSingleExpense = (externalId: string, currencyCode: number, operationAmount: number) =>
    Effect.gen(function* () {
        const monobankSyncService = yield* MonobankSyncService;
        const { account } = yield* setupMonobankFixture();
        monobankStub.statement([
            buildMonobank.transaction({
                id: externalId,
                description: 'Opening a deposit',
                comment: 'Term deposit',
                amount: -4_505_000,
                operationAmount,
                currencyCode,
                commissionRate: 5000,
                hold: false
            })
        ]);

        yield* monobankSyncService.sync();

        const [transaction] = yield* testDb.select().from(TransactionEntityTable).where(eq(TransactionEntityTable.externalId, externalId));
        const [sourceAccount] = yield* testDb.select().from(AccountEntityTable).where(eq(AccountEntityTable.id, account.id));

        return { sourceAccount, transaction };
    });

const fetchDepositAccounts = () => testDb.select().from(AccountEntityTable).where(eq(AccountEntityTable.type, AccountTypeEnum.DEPOSIT));

const seedHryvniaCashExpense = (externalId: string, amount: number) =>
    Effect.gen(function* () {
        const hryvnia = yield* requireInstrument(CurrencyEnum.UAH);
        const cashAccount = yield* seed.account({ title: 'Cash', type: AccountTypeEnum.CASH, instrumentId: hryvnia.id });
        const transaction = yield* seed.bankPairExpense(
            { externalId, operatedAt: new Date('2026-06-02T12:00:00.000Z') },
            { accountId: cashAccount.id, amount: amount * PRECISION }
        );

        return { hryvnia, cashAccount, transaction };
    });

describe('account/start-deposit-from-expense', () => {
    it.effect('creates an EUR deposit from a Monobank UAH expense with EUR operation metadata', () =>
        Effect.gen(function* () {
            const euro = yield* requireInstrument(CurrencyEnum.EUR);
            const { sourceAccount, transaction } = yield* syncSingleExpense(
                'tx-start-deposit',
                EUR_NUMERIC_CODE,
                -EURO_OPERATION_AMOUNT * 100
            );
            const depositAccount = yield* (yield* TransactionTransferService).startDepositFromExpense(
                transaction.id,
                buildDepositInput(euro.id, EURO_OPERATION_AMOUNT)
            );
            const entries = yield* fetchExpenseEntries(transaction.id);

            expect(depositAccount).toMatchObject({
                type: AccountTypeEnum.DEPOSIT,
                instrumentId: euro.id,
                integrationId: sourceAccount.integrationId
            });
            expect(yield* fetchTransactionById(transaction.id)).toMatchObject({
                type: TransactionTypeEnum.TRANSFER,
                fromAccountId: sourceAccount.id,
                toAccountId: depositAccount.id,
                exchangeRate: 45,
                externalId: 'tx-start-deposit',
                externalSource: ExternalSourceEnum.MONOBANK,
                operatedAt: transaction.operatedAt,
                comment: 'Term deposit'
            });
            expect(entries.find(entry => entry.type === TransactionEntryTypeEnum.CREDIT)).toMatchObject({
                accountId: sourceAccount.id,
                amount: FUNDING_AMOUNT * PRECISION,
                operationInstrumentId: euro.id,
                operationAmount: EURO_OPERATION_AMOUNT * PRECISION
            });
            expect(entries.find(entry => entry.type === TransactionEntryTypeEnum.DEBIT)).toMatchObject({
                accountId: depositAccount.id,
                amount: EURO_OPERATION_AMOUNT * PRECISION
            });
            expect(entries.find(entry => entry.type === TransactionEntryTypeEnum.DEBIT)?.baseInstrumentId).not.toBeNull();
            expect(entries.find(entry => entry.type === TransactionEntryTypeEnum.FEE)).toMatchObject({
                accountId: sourceAccount.id,
                amount: 50 * PRECISION,
                externalId: 'tx-start-deposit:fee'
            });
            expect(
                (yield* testDb.select().from(TransactionEntryEntityTable)).filter(entry => entry.accountId === depositAccount.id)
            ).toHaveLength(1);
            expect(
                (yield* (yield* AccountBalanceRepository).getLedgerBalances([sourceAccount.id, depositAccount.id])).get(depositAccount.id)
            ).toBe(EURO_OPERATION_AMOUNT * PRECISION);
        }).pipe(Effect.provide(TestLayer))
    );
});

describe('account/start-deposit-from-expense/same-currency', () => {
    it.effect('creates a same-currency deposit when the user confirms the source currency for a transaction without metadata', () =>
        Effect.gen(function* () {
            const transactionTransferService = yield* TransactionTransferService;
            const accountBalanceRepository = yield* AccountBalanceRepository;
            const { hryvnia, cashAccount, transaction } = yield* seedHryvniaCashExpense('manual-deposit', CASH_DEPOSIT_AMOUNT);
            const [sourceEntry] = yield* fetchExpenseEntries(transaction.id);

            const depositAccount = yield* transactionTransferService.startDepositFromExpense(
                transaction.id,
                buildDepositInput(hryvnia.id, CASH_DEPOSIT_AMOUNT)
            );

            const ledgerBalances = yield* accountBalanceRepository.getLedgerBalances([cashAccount.id, depositAccount.id]);

            expect(sourceEntry.operationInstrumentId).toBeNull();
            expect(depositAccount.instrumentId).toBe(hryvnia.id);
            expect(depositAccount.integrationId).toBeNull();
            expect((yield* fetchTransactionById(transaction.id)).exchangeRate).toBe(1);
            expect(ledgerBalances.get(cashAccount.id)).toBe(-CASH_DEPOSIT_AMOUNT * PRECISION);
            expect(ledgerBalances.get(depositAccount.id)).toBe(CASH_DEPOSIT_AMOUNT * PRECISION);
        }).pipe(Effect.provide(TestLayer))
    );

    it.effect('rejects a same-currency deposit whose receiving amount differs from the funding amount', () =>
        Effect.gen(function* () {
            const transactionTransferService = yield* TransactionTransferService;
            const accountBalanceRepository = yield* AccountBalanceRepository;
            const { hryvnia, cashAccount, transaction } = yield* seedHryvniaCashExpense('same-currency-mismatch', FUNDING_AMOUNT);

            const mismatchedReceivingAmount = 50_000;
            const error = yield* Effect.flip(
                transactionTransferService.startDepositFromExpense(transaction.id, buildDepositInput(hryvnia.id, mismatchedReceivingAmount))
            );

            const [unchanged] = yield* testDb.select().from(TransactionEntityTable).where(eq(TransactionEntityTable.id, transaction.id));
            const ledgerBalances = yield* accountBalanceRepository.getLedgerBalances([cashAccount.id]);

            expect(error).toBeInstanceOf(DepositReceivingAmountMismatchError);
            expect(yield* fetchDepositAccounts()).toEqual([]);
            expect(unchanged.type).toBe(TransactionTypeEnum.EXPENSE);
            expect(ledgerBalances.get(cashAccount.id)).toBe(-FUNDING_AMOUNT * PRECISION);
        }).pipe(Effect.provide(TestLayer))
    );
});

describe('account/start-deposit-from-expense/invalid-amounts', () => {
    it.effect.each([
        { fundingAmount: 0, receivingAmount: 1000 },
        { fundingAmount: -1, receivingAmount: 1000 },
        { fundingAmount: 0.0000005, receivingAmount: 1000 },
        { fundingAmount: Infinity, receivingAmount: 1000 },
        { fundingAmount: Number.MAX_SAFE_INTEGER, receivingAmount: 1000 },
        { fundingAmount: 45, receivingAmount: 1e308 },
        { fundingAmount: 45, receivingAmount: 0.0000001 },
        { fundingAmount: 45, receivingAmount: Number.MAX_SAFE_INTEGER }
    ])(
        'rejects invalid funding $fundingAmount or receiving $receivingAmount before creating a deposit',
        ({ fundingAmount, receivingAmount }) =>
            Effect.gen(function* () {
                const transactionTransferService = yield* TransactionTransferService;
                const euro = yield* requireInstrument(CurrencyEnum.EUR);
                const { transaction } = yield* seedHryvniaCashExpense('invalid-deposit-amount', fundingAmount);
                yield* testDb
                    .update(TransactionEntryEntityTable)
                    .set({
                        operationInstrumentId: euro.id,
                        operationAmount: 1000 * PRECISION
                    })
                    .where(eq(TransactionEntryEntityTable.transactionId, transaction.id));
                const entriesBefore = yield* fetchExpenseEntries(transaction.id);

                const exit = yield* Effect.exit(
                    transactionTransferService.startDepositFromExpense(transaction.id, buildDepositInput(euro.id, receivingAmount))
                );

                const unchanged = yield* fetchTransactionById(transaction.id);

                expect(Exit.isFailure(exit)).toBe(true);
                expect(yield* fetchDepositAccounts()).toEqual([]);
                expect(unchanged).toEqual(transaction);
                expect(unchanged.type).toBe(TransactionTypeEnum.EXPENSE);
                expect(yield* fetchExpenseEntries(transaction.id)).toEqual(entriesBefore);
            }).pipe(Effect.provide(TestLayer))
    );
});

describe('account/start-deposit-from-expense/rollback-and-operation-currency', () => {
    it.effect('rolls back the deposit account when the transfer conversion fails', () =>
        Effect.gen(function* () {
            const transactionTransferService = yield* TransactionTransferService;
            const euro = yield* requireInstrument(CurrencyEnum.EUR);
            const debtAccount = yield* seed.account({
                title: 'Lent',
                type: AccountTypeEnum.DEBT,
                debtType: AccountDebtTypeEnum.LENT,
                targetBalance: 500 * PRECISION
            });
            const transaction = yield* seed.bankPairExpense(
                { externalId: 'debt-funded-deposit', operatedAt: new Date('2026-06-02T12:00:00.000Z') },
                { accountId: debtAccount.id, amount: 100 * PRECISION }
            );
            const entriesBefore = yield* fetchExpenseEntries(transaction.id);

            const exit = yield* Effect.exit(
                transactionTransferService.startDepositFromExpense(transaction.id, buildDepositInput(euro.id, 3))
            );

            const [unchanged] = yield* testDb.select().from(TransactionEntityTable).where(eq(TransactionEntityTable.id, transaction.id));

            expect(Exit.isFailure(exit)).toBe(true);
            expect(yield* fetchDepositAccounts()).toEqual([]);
            expect(unchanged.type).toBe(TransactionTypeEnum.EXPENSE);
            expect(unchanged.toAccountId).toBeNull();
            expect(yield* fetchExpenseEntries(transaction.id)).toEqual(entriesBefore);
        }).pipe(Effect.provide(TestLayer))
    );

    it.effect('keeps a same-currency Monobank expense in UAH when the operation currency equals the account currency', () =>
        Effect.gen(function* () {
            const transactionTransferService = yield* TransactionTransferService;
            const hryvnia = yield* requireInstrument(CurrencyEnum.UAH);
            const { transaction } = yield* syncSingleExpense('tx-same-currency-deposit', UAH_NUMERIC_CODE, -FUNDING_AMOUNT * 100);
            const [sourceEntry] = (yield* fetchExpenseEntries(transaction.id)).filter(
                entry => entry.type === TransactionEntryTypeEnum.CREDIT
            );

            const depositAccount = yield* transactionTransferService.startDepositFromExpense(
                transaction.id,
                buildDepositInput(hryvnia.id, FUNDING_AMOUNT)
            );

            expect(sourceEntry.operationInstrumentId).toBe(hryvnia.id);
            expect(depositAccount.instrumentId).toBe(hryvnia.id);
        }).pipe(Effect.provide(TestLayer))
    );
});
