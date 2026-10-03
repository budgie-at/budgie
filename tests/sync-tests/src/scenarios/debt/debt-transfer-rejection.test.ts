import {
    AccountDebtTypeEnum,
    AccountTypeEnum,
    BANK_FEE_CATEGORY_ID,
    DebtEventEntityTable,
    ExternalSourceEnum,
    PRECISION,
    TransactionEntityTable,
    TransactionEntryEntityTable,
    TransactionEntryKindEnum,
    TransactionEntryTypeEnum,
    TransactionTypeEnum
} from '@budgie/contracts';
import { TransactionDebtSettlementService, TransactionService, TransactionTransferService, TransferCreationService } from '@budgie/ledger';
import { describe, expect, it } from '@effect/vitest';
import * as Effect from 'effect/Effect';

import { buildTransferInput, seed, testDb, TestLayer } from '../../harness';
import { insertOne } from '../../harness/db/insert-one';

import type {
    TransactionCreateEntityInterface,
    TransactionEntryCreateEntityInterface,
    TransactionUpdateServiceInputInterface
} from '@budgie/contracts';

const TRANSFERRED_AMOUNT = 250 * PRECISION;
const OPERATED_AT = new Date('2026-06-02T12:00:00.000Z');
const DEBT_TRANSFER_ERROR = 'Debt accounts cannot take part in transfers';
const FEE_AMOUNT = 3;

const createDebtAccount = () =>
    Effect.gen(function* () {
        return yield* seed.account({
            title: 'Transfer debt account',
            type: AccountTypeEnum.DEBT,
            debtType: AccountDebtTypeEnum.LENT,
            targetBalance: 500 * PRECISION
        });
    });

const createExpense = (cashAccountId: number) =>
    Effect.gen(function* () {
        const transaction = yield* insertOne(TransactionEntityTable, {
            type: TransactionTypeEnum.EXPENSE,
            title: 'Lent to Alex',
            externalId: null,
            externalSource: ExternalSourceEnum.MONOBANK,
            operatedAt: OPERATED_AT,
            comment: '',
            exchangeRate: 1,
            updatedBy: null,
            fromAccountId: cashAccountId,
            toAccountId: null
        } satisfies TransactionCreateEntityInterface);

        yield* insertOne(TransactionEntryEntityTable, {
            transactionId: transaction.id,
            accountId: cashAccountId,
            type: TransactionEntryTypeEnum.CREDIT,
            kind: TransactionEntryKindEnum.PRIMARY,
            amount: TRANSFERRED_AMOUNT,
            categoryId: null,
            mccCategoryId: null,
            externalId: null,
            exchangeRate: 1,
            baseInstrumentId: 1,
            baseExchangeRate: 1,
            baseAmount: TRANSFERRED_AMOUNT,
            toIban: null,
            originalTransactionId: null
        } satisfies TransactionEntryCreateEntityInterface);

        return transaction;
    });

const buildTransferEntry = (accountId: number, type: TransactionEntryTypeEnum, amount: number) => ({
    accountId,
    type,
    kind: TransactionEntryKindEnum.PRIMARY,
    amount,
    categoryId: type === TransactionEntryTypeEnum.FEE ? BANK_FEE_CATEGORY_ID : null,
    mccCategoryId: null
});

const buildTransferWithFeeInput = (fromAccountId: number, toAccountId: number): TransactionUpdateServiceInputInterface => ({
    type: TransactionTypeEnum.TRANSFER,
    title: 'Lent to Alex',
    operatedAt: OPERATED_AT,
    comment: '',
    fromAccountId,
    toAccountId,
    exchangeRate: 1,
    entries: [
        buildTransferEntry(fromAccountId, TransactionEntryTypeEnum.CREDIT, TRANSFERRED_AMOUNT / PRECISION),
        buildTransferEntry(toAccountId, TransactionEntryTypeEnum.DEBIT, TRANSFERRED_AMOUNT / PRECISION),
        buildTransferEntry(fromAccountId, TransactionEntryTypeEnum.FEE, FEE_AMOUNT)
    ],
    tagIds: []
});

const fetchFeeAmounts = (transactionId: number) =>
    Effect.gen(function* () {
        return (yield* testDb.select().from(TransactionEntryEntityTable))
            .filter(entry => entry.transactionId === transactionId && entry.type === TransactionEntryTypeEnum.FEE)
            .map(entry => entry.amount);
    });

describe('transfers involving a debt account', () => {
    it.effect('rejects converting an expense into a transfer to a debt account', () =>
        Effect.gen(function* () {
            const transactionTransferService = yield* TransactionTransferService;

            const cashAccount = yield* seed.account({ title: 'Transfer cash account', type: AccountTypeEnum.BANK_SYNC });
            const debtAccount = yield* createDebtAccount();
            const transaction = yield* createExpense(cashAccount.id);

            const conversionError = yield* Effect.flip(
                transactionTransferService.convertExpenseToTransfer({
                    id: transaction.id,
                    accountId: debtAccount.id,
                    customExchangeRate: 0,
                    feeEntries: []
                })
            );

            expect(conversionError.message).toContain(DEBT_TRANSFER_ERROR);

            const stored = (yield* testDb.select().from(TransactionEntityTable)).find(row => row.id === transaction.id);

            expect(stored?.type).toBe(TransactionTypeEnum.EXPENSE);
        }).pipe(Effect.provide(TestLayer))
    );

    it.effect('drops the debt attachment when an attached expense becomes a transfer so a fee can be saved', () =>
        Effect.gen(function* () {
            const transactionDebtSettlementService = yield* TransactionDebtSettlementService;
            const transactionTransferService = yield* TransactionTransferService;
            const transactionService = yield* TransactionService;

            const cashAccount = yield* seed.account({ title: 'Transfer cash account', type: AccountTypeEnum.BANK_SYNC });
            const debtAccount = yield* createDebtAccount();
            const transaction = yield* createExpense(cashAccount.id);

            yield* transactionDebtSettlementService.attach({ transactionId: transaction.id, debtAccountId: debtAccount.id });

            const depositAccount = yield* seed.account({ title: 'New deposit', type: AccountTypeEnum.DEPOSIT });

            yield* transactionTransferService.convertExpenseToTransfer({
                id: transaction.id,
                accountId: depositAccount.id,
                customExchangeRate: 0,
                feeEntries: []
            });

            expect(
                (yield* testDb.select().from(DebtEventEntityTable)).filter(debtEvent => debtEvent.transactionId === transaction.id)
            ).toHaveLength(0);

            yield* transactionService.updateById(transaction.id, buildTransferWithFeeInput(cashAccount.id, depositAccount.id));

            expect(yield* fetchFeeAmounts(transaction.id)).toEqual([FEE_AMOUNT * PRECISION]);
        }).pipe(Effect.provide(TestLayer))
    );

    it.effect('rejects creating a transfer into a debt account and writes no rows', () =>
        Effect.gen(function* () {
            const transferCreationService = yield* TransferCreationService;

            const cashAccount = yield* seed.account({ title: 'Transfer cash account', type: AccountTypeEnum.BANK_SYNC });
            const debtAccount = yield* createDebtAccount();

            const creationError = yield* Effect.flip(
                transferCreationService.createInternalTransfer(buildTransferInput(cashAccount.id, debtAccount.id, 250, OPERATED_AT))
            );

            expect(creationError.message).toContain(DEBT_TRANSFER_ERROR);

            expect(yield* testDb.select().from(TransactionEntityTable)).toHaveLength(0);
            expect(yield* testDb.select().from(TransactionEntryEntityTable)).toHaveLength(0);
        }).pipe(Effect.provide(TestLayer))
    );
});
