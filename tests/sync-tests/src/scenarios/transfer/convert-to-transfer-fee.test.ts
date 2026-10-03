import {
    AccountBalanceRepository,
    AccountTypeEnum,
    BANK_FEE_CATEGORY_ID,
    PRECISION,
    TransactionEntryEntityTable,
    TransactionEntryKindEnum,
    TransactionEntryTypeEnum
} from '@budgie/contracts';
import { TransactionTransferService } from '@budgie/ledger';
import { describe, expect, it } from '@effect/vitest';
import * as Effect from 'effect/Effect';

import { seed, testDb, TestLayer } from '../../harness';

const EXPENSE_AMOUNT = 250;
const FEE_AMOUNT = 3;

describe('transfer/convert-to-transfer-fee', () => {
    it.effect('stores the fee entered in the conversion form on the source account', () =>
        Effect.gen(function* () {
            const transactionTransferService = yield* TransactionTransferService;
            const accountBalanceRepository = yield* AccountBalanceRepository;
            const cashAccount = yield* seed.account({ title: 'Cash', type: AccountTypeEnum.CASH });
            const depositAccount = yield* seed.account({ title: 'Savings', type: AccountTypeEnum.DEPOSIT });
            const transaction = yield* seed.bankPairExpense(
                { externalId: 'savings-move', operatedAt: new Date('2026-06-02T12:00:00.000Z') },
                { accountId: cashAccount.id, amount: EXPENSE_AMOUNT * PRECISION }
            );

            yield* transactionTransferService.convertExpenseToTransfer({
                id: transaction.id,
                accountId: depositAccount.id,
                customExchangeRate: 0,
                feeEntries: [
                    {
                        type: TransactionEntryTypeEnum.FEE,
                        kind: TransactionEntryKindEnum.PRIMARY,
                        amount: FEE_AMOUNT,
                        categoryId: BANK_FEE_CATEGORY_ID,
                        mccCategoryId: null
                    }
                ]
            });

            const feeEntries = (yield* testDb.select().from(TransactionEntryEntityTable)).filter(
                entry => entry.transactionId === transaction.id && entry.type === TransactionEntryTypeEnum.FEE
            );
            const ledgerBalances = yield* accountBalanceRepository.getLedgerBalances([cashAccount.id, depositAccount.id]);

            expect(feeEntries.map(entry => [entry.accountId, entry.amount])).toEqual([[cashAccount.id, FEE_AMOUNT * PRECISION]]);
            expect(ledgerBalances.get(cashAccount.id)).toBe(-(EXPENSE_AMOUNT + FEE_AMOUNT) * PRECISION);
            expect(ledgerBalances.get(depositAccount.id)).toBe(EXPENSE_AMOUNT * PRECISION);
            expect((yield* accountBalanceRepository.getByAccountId(cashAccount.id)).at(0)?.balance).toBe(
                -(EXPENSE_AMOUNT + FEE_AMOUNT) * PRECISION
            );
        }).pipe(Effect.provide(TestLayer))
    );
});
