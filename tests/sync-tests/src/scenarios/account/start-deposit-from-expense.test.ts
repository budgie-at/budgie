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
            const transactionTransferService = yield* TransactionTransferService;
            const accountBalanceRepository = yield* AccountBalanceRepository;
            const euro = yield* requireInstrument(CurrencyEnum.EUR);
            const { sourceAccount, transaction } = yield* syncSingleExpense('tx-start-deposit', EUR_NUMERIC_CODE, -100_000);

            const depositAccount = yield* transactionTransferService.startDepositFromExpense(
                transaction.id,
                buildDepositInput(euro.id, 1000)
            );

            const [converted] = yield* testDb.select().from(TransactionEntityTable).where(eq(TransactionEntityTable.id, transaction.id));
            const entries = yield* fetchExpenseEntries(transaction.id);
            const creditEntry = entries.find(entry => entry.type === TransactionEntryTypeEnum.CREDIT);
            const debitEntry = entries.find(entry => entry.type === TransactionEntryTypeEnum.DEBIT);
            const feeEntry = entries.find(entry => entry.type === TransactionEntryTypeEnum.FEE);
            const depositEntries = (yield* testDb.select().from(TransactionEntryEntityTable)).filter(
                entry => entry.accountId === depositAccount.id
            );
            const ledgerBalances = yield* accountBalanceRepository.getLedgerBalances([sourceAccount.id, depositAccount.id]);

            expect(depositAccount.type).toBe(AccountTypeEnum.DEPOSIT);
            expect(depositAccount.instrumentId).toBe(euro.id);
            expect(depositAccount.integrationId).toBe(sourceAccount.integrationId);
            expect(converted.type).toBe(TransactionTypeEnum.TRANSFER);
            expect(converted.fromAccountId).toBe(sourceAccount.id);
            expect(converted.toAccountId).toBe(depositAccount.id);
            expect(converted.exchangeRate).toBe(45);
            expect(converted.externalId).toBe('tx-start-deposit');
            expect(converted.externalSource).toBe(ExternalSourceEnum.MONOBANK);
            expect(converted.operatedAt).toEqual(transaction.operatedAt);
            expect(converted.comment).toBe('Term deposit');
            expect(creditEntry?.accountId).toBe(sourceAccount.id);
            expect(creditEntry?.amount).toBe(45_000 * PRECISION);
            expect(creditEntry?.operationInstrumentId).toBe(euro.id);
            expect(creditEntry?.operationAmount).toBe(1000 * PRECISION);
            expect(debitEntry?.accountId).toBe(depositAccount.id);
            expect(debitEntry?.amount).toBe(1000 * PRECISION);
            expect(debitEntry?.baseInstrumentId).not.toBeNull();
            expect(feeEntry?.accountId).toBe(sourceAccount.id);
            expect(feeEntry?.amount).toBe(50 * PRECISION);
            expect(feeEntry?.externalId).toBe('tx-start-deposit:fee');
            expect(depositEntries).toHaveLength(1);
            expect(ledgerBalances.get(depositAccount.id)).toBe(1000 * PRECISION);
        }).pipe(Effect.provide(TestLayer))
    );

    it.effect('creates a same-currency deposit when the user confirms the source currency for a transaction without metadata', () =>
        Effect.gen(function* () {
            const transactionTransferService = yield* TransactionTransferService;
            const accountBalanceRepository = yield* AccountBalanceRepository;
            const { hryvnia, cashAccount, transaction } = yield* seedHryvniaCashExpense('manual-deposit', 250);
            const [sourceEntry] = yield* fetchExpenseEntries(transaction.id);

            const depositAccount = yield* transactionTransferService.startDepositFromExpense(
                transaction.id,
                buildDepositInput(hryvnia.id, 250)
            );

            const [converted] = yield* testDb.select().from(TransactionEntityTable).where(eq(TransactionEntityTable.id, transaction.id));
            const ledgerBalances = yield* accountBalanceRepository.getLedgerBalances([cashAccount.id, depositAccount.id]);

            expect(sourceEntry.operationInstrumentId).toBeNull();
            expect(depositAccount.instrumentId).toBe(hryvnia.id);
            expect(depositAccount.integrationId).toBeNull();
            expect(converted.exchangeRate).toBe(1);
            expect(ledgerBalances.get(cashAccount.id)).toBe(-250 * PRECISION);
            expect(ledgerBalances.get(depositAccount.id)).toBe(250 * PRECISION);
        }).pipe(Effect.provide(TestLayer))
    );

    it.effect('rejects a same-currency deposit whose receiving amount differs from the funding amount', () =>
        Effect.gen(function* () {
            const transactionTransferService = yield* TransactionTransferService;
            const accountBalanceRepository = yield* AccountBalanceRepository;
            const { hryvnia, cashAccount, transaction } = yield* seedHryvniaCashExpense('same-currency-mismatch', 45_000);

            const error = yield* Effect.flip(
                transactionTransferService.startDepositFromExpense(transaction.id, buildDepositInput(hryvnia.id, 50_000))
            );

            const [unchanged] = yield* testDb.select().from(TransactionEntityTable).where(eq(TransactionEntityTable.id, transaction.id));
            const ledgerBalances = yield* accountBalanceRepository.getLedgerBalances([cashAccount.id]);

            expect(error).toBeInstanceOf(DepositReceivingAmountMismatchError);
            expect(yield* fetchDepositAccounts()).toEqual([]);
            expect(unchanged.type).toBe(TransactionTypeEnum.EXPENSE);
            expect(ledgerBalances.get(cashAccount.id)).toBe(-45_000 * PRECISION);
        }).pipe(Effect.provide(TestLayer))
    );

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
            const { transaction } = yield* syncSingleExpense('tx-same-currency-deposit', UAH_NUMERIC_CODE, -4_500_000);
            const [sourceEntry] = (yield* fetchExpenseEntries(transaction.id)).filter(
                entry => entry.type === TransactionEntryTypeEnum.CREDIT
            );

            const depositAccount = yield* transactionTransferService.startDepositFromExpense(
                transaction.id,
                buildDepositInput(hryvnia.id, 45_000)
            );

            expect(sourceEntry.operationInstrumentId).toBe(hryvnia.id);
            expect(depositAccount.instrumentId).toBe(hryvnia.id);
        }).pipe(Effect.provide(TestLayer))
    );
});
