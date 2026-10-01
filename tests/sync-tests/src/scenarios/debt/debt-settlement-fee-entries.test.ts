import { convertFromMicroUnits } from '@app/@generic/utils/convert-from-micro-units.util';
import { TransactionDebtSettlementService } from '@app/transaction/service/transaction-debt-settlement.service';
import { TransactionService } from '@app/transaction/service/transaction.service';
import {
    AccountBalanceRepository,
    AccountDebtTypeEnum,
    AccountTypeEnum,
    BANK_FEE_CATEGORY_ID,
    CategorySourceEnum,
    DebtEventDirectionEnum,
    DebtEventEntityTable,
    DebtEventSourceEnum,
    ExternalSourceEnum,
    LENDING_CATEGORY_ID,
    PRECISION,
    TransactionEntryEntityTable,
    TransactionEntryKindEnum,
    TransactionEntryTypeEnum,
    TransactionEntityTable,
    TransactionTypeEnum
} from '@budgie/contracts';
import { describe, expect, it } from '@effect/vitest';
import { and, eq, isNull } from 'drizzle-orm';
import * as Effect from 'effect/Effect';
import * as Exit from 'effect/Exit';

import { isDefined } from '@rnw-community/shared';

import { seed, testDb, TestLayer } from '../../harness';
import { insertOne } from '../../harness/db/insert-one';

import type { TransactionCreateEntityInterface, TransactionUpdateServiceInputInterface } from '@budgie/contracts';

const PRIMARY_ENTRY_AMOUNT = 100 * PRECISION;
const FEE_ENTRY_AMOUNT = 5 * PRECISION;
const UPDATED_ENTRY_AMOUNT = 80;
const OPERATED_AT = new Date('2026-06-05T09:00:00.000Z');

const seedFeeCashAccount = () =>
    Effect.gen(function* () {
        return yield* seed.account({ title: 'Fee cash account', type: AccountTypeEnum.BANK_SYNC });
    });

const seedLentDebtAccount = () =>
    Effect.gen(function* () {
        const account = yield* seed.account({
            title: 'Fee debt account',
            type: AccountTypeEnum.DEBT,
            debtType: AccountDebtTypeEnum.LENT,
            targetBalance: 300 * PRECISION
        });

        yield* insertOne(DebtEventEntityTable, {
            debtAccountId: account.id,
            direction: DebtEventDirectionEnum.OPEN,
            source: DebtEventSourceEnum.MANUAL,
            amount: 300 * PRECISION,
            operatedAt: OPERATED_AT
        });

        return account;
    });

const seedSyncedExpenseTransaction = (cashAccountId: number) =>
    Effect.gen(function* () {
        return yield* insertOne(TransactionEntityTable, {
            type: TransactionTypeEnum.EXPENSE,
            title: 'Coffee shop purchase',
            externalId: 'privatbank-expense',
            externalSource: ExternalSourceEnum.PRIVATBANK,
            operatedAt: OPERATED_AT,
            comment: '',
            exchangeRate: 1,
            updatedBy: null,
            fromAccountId: cashAccountId,
            toAccountId: null
        } satisfies TransactionCreateEntityInterface);
    });

const seedCreditEntry = (transactionId: number, cashAccountId: number, amount: number, externalId: string | null) =>
    Effect.gen(function* () {
        return yield* insertOne(TransactionEntryEntityTable, {
            transactionId,
            accountId: cashAccountId,
            type: TransactionEntryTypeEnum.CREDIT,
            kind: TransactionEntryKindEnum.PRIMARY,
            amount,
            categoryId: null,
            mccCategoryId: null,
            externalId,
            exchangeRate: 1,
            baseInstrumentId: 1,
            baseExchangeRate: 1,
            baseAmount: amount,
            toIban: null,
            originalTransactionId: null
        });
    });

const seedFeeBearingEntries = (transactionId: number, cashAccountId: number) =>
    Effect.gen(function* () {
        const creditEntry = yield* seedCreditEntry(transactionId, cashAccountId, PRIMARY_ENTRY_AMOUNT, 'privatbank-expense');
        const feeEntry = yield* insertOne(TransactionEntryEntityTable, {
            transactionId,
            accountId: cashAccountId,
            type: TransactionEntryTypeEnum.FEE,
            kind: TransactionEntryKindEnum.PRIMARY,
            amount: FEE_ENTRY_AMOUNT,
            categoryId: BANK_FEE_CATEGORY_ID,
            categorySource: CategorySourceEnum.FEE,
            mccCategoryId: null,
            externalId: 'privatbank-expense:fee',
            exchangeRate: 1,
            baseInstrumentId: 1,
            baseExchangeRate: 1,
            baseAmount: FEE_ENTRY_AMOUNT,
            toIban: null,
            originalTransactionId: null
        });

        return { creditEntry, feeEntry };
    });

const buildPlainExpenseUpdateInput = (accountId: number, amount: number): TransactionUpdateServiceInputInterface => ({
    type: TransactionTypeEnum.EXPENSE,
    title: 'Coffee shop purchase',
    operatedAt: OPERATED_AT,
    comment: '',
    fromAccountId: accountId,
    toAccountId: null,
    exchangeRate: 1,
    entries: [
        {
            accountId,
            type: TransactionEntryTypeEnum.CREDIT,
            kind: TransactionEntryKindEnum.PRIMARY,
            amount,
            categoryId: null,
            mccCategoryId: null
        }
    ],
    tagIds: []
});

const seedFeeBearingDebtScenario = () =>
    Effect.gen(function* () {
        const cashAccount = yield* seedFeeCashAccount();
        const debtAccount = yield* seedLentDebtAccount();
        const transaction = yield* seedSyncedExpenseTransaction(cashAccount.id);

        return { debtAccount, transaction, ...(yield* seedFeeBearingEntries(transaction.id, cashAccount.id)) };
    });

const fetchEntryById = (entryId: number) =>
    Effect.gen(function* () {
        const [entry] = yield* testDb.select().from(TransactionEntryEntityTable).where(eq(TransactionEntryEntityTable.id, entryId));

        return entry;
    });

const fetchLivePrimaryEntries = (transactionId: number) =>
    Effect.gen(function* () {
        return (yield* testDb.select().from(TransactionEntryEntityTable)).filter(
            entry => entry.transactionId === transactionId && entry.kind === TransactionEntryKindEnum.PRIMARY && entry.deletedAt === null
        );
    });

const fetchLiveDebtEvent = (transactionId: number) =>
    Effect.gen(function* () {
        const [debtEvent] = yield* testDb
            .select()
            .from(DebtEventEntityTable)
            .where(and(eq(DebtEventEntityTable.transactionId, transactionId), isNull(DebtEventEntityTable.deletedAt)));

        return debtEvent;
    });

const fetchDebtProgress = Effect.fnUntraced(function* (debtAccountId: number) {
    const accountBalanceRepository = yield* AccountBalanceRepository;
    const progress = (yield* accountBalanceRepository.getDebtAccountProgressByAccountId(debtAccountId)).at(0);

    if (!isDefined(progress)) {
        throw new Error(`Debt progress for account ${debtAccountId} not found`);
    }

    return { paidAmount: convertFromMicroUnits(progress.paidAmount), totalAmount: convertFromMicroUnits(progress.totalAmount) };
});

describe('debt settlement fee entries', () => {
    it.effect('attaches a fee-bearing synced expense to a debt', () =>
        Effect.gen(function* () {
            const transactionDebtSettlementService = yield* TransactionDebtSettlementService;

            const { debtAccount, transaction, creditEntry, feeEntry } = yield* seedFeeBearingDebtScenario();

            expect(
                yield* transactionDebtSettlementService.attach({ transactionId: transaction.id, debtAccountId: debtAccount.id })
            ).toBeDefined();

            const debtEvent = yield* fetchLiveDebtEvent(transaction.id);

            expect(debtEvent?.transactionEntryId).toBe(creditEntry.id);
            expect(debtEvent?.amount).toBe(PRIMARY_ENTRY_AMOUNT);
            expect(debtEvent?.direction).toBe(DebtEventDirectionEnum.OPEN);
            expect(debtEvent?.source).toBe(DebtEventSourceEnum.INCOME_ATTACHMENT);

            const updatedCreditEntry = yield* fetchEntryById(creditEntry.id);
            const updatedFeeEntry = yield* fetchEntryById(feeEntry.id);

            expect(updatedCreditEntry?.categoryId).toBe(LENDING_CATEGORY_ID);
            expect(updatedCreditEntry?.categorySource).toBe(CategorySourceEnum.DEBT_SETTLEMENT);
            expect(updatedFeeEntry?.categoryId).toBe(BANK_FEE_CATEGORY_ID);
            expect(updatedFeeEntry?.categorySource).toBe(CategorySourceEnum.FEE);
            expect(yield* fetchDebtProgress(debtAccount.id)).toEqual({ paidAmount: 0, totalAmount: 400 });
        }).pipe(Effect.provide(TestLayer))
    );

    it.effect('rejects a transaction with two non-fee primary entries', () =>
        Effect.gen(function* () {
            const transactionDebtSettlementService = yield* TransactionDebtSettlementService;

            const cashAccount = yield* seedFeeCashAccount();
            const debtAccount = yield* seedLentDebtAccount();
            const transaction = yield* seedSyncedExpenseTransaction(cashAccount.id);

            yield* seedCreditEntry(transaction.id, cashAccount.id, PRIMARY_ENTRY_AMOUNT, null);
            yield* seedCreditEntry(transaction.id, cashAccount.id, FEE_ENTRY_AMOUNT, null);

            const attachExit = yield* Effect.exit(
                transactionDebtSettlementService.attach({ transactionId: transaction.id, debtAccountId: debtAccount.id })
            );

            expect(Exit.isFailure(attachExit)).toBe(true);
        }).pipe(Effect.provide(TestLayer))
    );

    it.effect('detach reverts the settlement category on the non-fee entry of a fee-bearing expense', () =>
        Effect.gen(function* () {
            const transactionDebtSettlementService = yield* TransactionDebtSettlementService;

            const { debtAccount, transaction, creditEntry, feeEntry } = yield* seedFeeBearingDebtScenario();

            yield* transactionDebtSettlementService.attach({ transactionId: transaction.id, debtAccountId: debtAccount.id });
            yield* transactionDebtSettlementService.detach(transaction.id);

            const revertedCreditEntry = yield* fetchEntryById(creditEntry.id);
            const untouchedFeeEntry = yield* fetchEntryById(feeEntry.id);

            expect(revertedCreditEntry?.categoryId).toBeNull();
            expect(revertedCreditEntry?.categorySource).toBe(CategorySourceEnum.USER);
            expect(untouchedFeeEntry?.categoryId).toBe(BANK_FEE_CATEGORY_ID);
            expect(untouchedFeeEntry?.categorySource).toBe(CategorySourceEnum.FEE);
            expect(yield* fetchLiveDebtEvent(transaction.id)).toBeUndefined();
        }).pipe(Effect.provide(TestLayer))
    );

    it.effect('keeps the debt event pointing at the live entry after the transaction is edited', () =>
        Effect.gen(function* () {
            const transactionDebtSettlementService = yield* TransactionDebtSettlementService;
            const transactionService = yield* TransactionService;

            const cashAccount = yield* seedFeeCashAccount();
            const debtAccount = yield* seedLentDebtAccount();
            const transaction = yield* seedSyncedExpenseTransaction(cashAccount.id);
            const originalEntry = yield* seedCreditEntry(transaction.id, cashAccount.id, PRIMARY_ENTRY_AMOUNT, null);

            yield* transactionDebtSettlementService.attach({ transactionId: transaction.id, debtAccountId: debtAccount.id });
            yield* transactionService.updateById(transaction.id, buildPlainExpenseUpdateInput(cashAccount.id, UPDATED_ENTRY_AMOUNT));

            const staleEntry = yield* fetchEntryById(originalEntry.id);
            const [newPrimaryEntry] = yield* fetchLivePrimaryEntries(transaction.id);
            const debtEvent = yield* fetchLiveDebtEvent(transaction.id);

            expect(staleEntry).toBeUndefined();
            expect(debtEvent?.transactionEntryId).toBe(newPrimaryEntry?.id);
            expect(debtEvent?.amount).toBe(UPDATED_ENTRY_AMOUNT * PRECISION);
            expect(debtEvent?.baseAmount).toBe(UPDATED_ENTRY_AMOUNT * PRECISION);
            expect(yield* fetchDebtProgress(debtAccount.id)).toEqual({ paidAmount: 0, totalAmount: 300 + UPDATED_ENTRY_AMOUNT });
        }).pipe(Effect.provide(TestLayer))
    );
});
