import { AccountBalanceIncrementalService } from '@app/account/service/account-balance-incremental.service';
import {
    AccountBalanceRepository,
    AccountBalanceEntityTable,
    AccountTypeEnum,
    TransactionEntityTable,
    TransactionEntryEntityTable,
    TransactionEntryTypeEnum,
    TransactionTypeEnum
} from '@budgie/contracts';
import { describe, expect, it } from '@effect/vitest';
import { eq } from 'drizzle-orm';
import * as Effect from 'effect/Effect';

import { seed, testDb, TestLayer } from '../../harness';
import { insertOne } from '../../harness/db/insert-one';

const OLD_BALANCE_UPDATED_AT = new Date(2026, 0, 1);

const seedExpenseEntry = (accountId: number, amount: number) =>
    Effect.gen(function* () {
        const transaction = yield* insertOne(TransactionEntityTable, {
            type: TransactionTypeEnum.EXPENSE,
            title: 'Scoped expense',
            externalId: null,
            comment: '',
            toAccountId: null,
            fromAccountId: accountId,
            exchangeRate: 1,
            externalSource: null,
            updatedBy: null,
            needsEmbedding: false
        });

        yield* insertOne(TransactionEntryEntityTable, {
            transactionId: transaction.id,
            accountId,
            type: TransactionEntryTypeEnum.CREDIT,
            amount,
            categoryId: null,
            mccCategoryId: null,
            externalId: null,
            exchangeRate: 1,
            baseInstrumentId: null,
            baseExchangeRate: null,
            baseAmount: null,
            toIban: null,
            originalTransactionId: null
        });
    });

const fetchBalanceRow = (accountId: number) =>
    Effect.gen(function* () {
        return yield* testDb.select().from(AccountBalanceEntityTable).where(eq(AccountBalanceEntityTable.accountId, accountId));
    });

describe('account/account-balance-scope', () => {
    it.effect('rebuilds only requested account balances', () =>
        Effect.gen(function* () {
            const accountBalanceRepository = yield* AccountBalanceRepository;
            const accountBalanceIncrementalService = yield* AccountBalanceIncrementalService;
            const changedAccount = yield* seed.account({ type: AccountTypeEnum.BANK, instrumentId: 1 });
            const untouchedAccount = yield* seed.account({ type: AccountTypeEnum.CASH, instrumentId: 1 });

            yield* insertOne(AccountBalanceEntityTable, {
                accountId: changedAccount.id,
                amount: 10_000,
                updatedAt: OLD_BALANCE_UPDATED_AT
            });
            yield* insertOne(AccountBalanceEntityTable, {
                accountId: untouchedAccount.id,
                amount: -50_000,
                updatedAt: OLD_BALANCE_UPDATED_AT
            });
            yield* seedExpenseEntry(untouchedAccount.id, 50_000);
            yield* seedExpenseEntry(changedAccount.id, 12_000);

            yield* accountBalanceIncrementalService.updateBalancesByAccountIds([changedAccount.id]);

            const changedBalance = (yield* accountBalanceRepository.getByAccountId(changedAccount.id)).at(0);
            const [untouchedBalance] = yield* fetchBalanceRow(untouchedAccount.id);

            expect(changedBalance?.balance).toBe(-12_000);
            expect(untouchedBalance?.amount).toBe(-50_000);
            expect(untouchedBalance?.updatedAt).toEqual(OLD_BALANCE_UPDATED_AT);
        }).pipe(Effect.provide(TestLayer))
    );
});
