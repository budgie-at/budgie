import { accountBalanceRepository } from '@app/@generic/drizzle/db/db';
import { accountBalanceIncrementalService } from '@app/account/service/account-balance-incremental.service';
import {
    AccountBalanceEntityTable,
    AccountTypeEnum,
    SyncBalanceAuthorityEnum,
    TransactionEntityTable,
    TransactionEntryEntityTable,
    TransactionEntryTypeEnum,
    TransactionTypeEnum
} from '@budgie/contracts';
import { describe, expect, it } from 'vitest';

import { seed } from '../../harness';
import { insertOne } from '../../harness/db/insert-one';

const ANCHOR_BALANCE = 250_000;

const seedExpenseEntry = (accountId: number, amount: number): void => {
    const transaction = insertOne(TransactionEntityTable, {
        type: TransactionTypeEnum.EXPENSE,
        title: 'Imported expense',
        externalId: null,
        comment: '',
        toAccountId: null,
        fromAccountId: accountId,
        exchangeRate: 1,
        externalSource: null,
        updatedBy: null,
        needsEmbedding: false
    });

    insertOne(TransactionEntryEntityTable, {
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
};

const seedProviderAuthoritativeAccount = (): number => {
    const account = seed.account({ type: AccountTypeEnum.BANK_SYNC, instrumentId: 1 });
    seed.sync({ accountId: account.id, balanceAuthority: SyncBalanceAuthorityEnum.PROVIDER });
    insertOne(AccountBalanceEntityTable, { accountId: account.id, amount: ANCHOR_BALANCE, updatedAt: new Date(0) });
    seedExpenseEntry(account.id, 75_000);

    return account.id;
};

describe('account/provider-authoritative-balance', () => {
    it('returns the stored provider balance while the sync is provider-authoritative', () => {
        const accountId = seedProviderAuthoritativeAccount();

        expect(accountBalanceRepository.getByAccountId(accountId).get()?.balance).toBe(ANCHOR_BALANCE);
    });

    it('preserves provider anchors during targeted and full incremental rebuilds', async () => {
        const accountId = seedProviderAuthoritativeAccount();

        await accountBalanceIncrementalService.updateBalancesByAccountIds([accountId]);
        await accountBalanceIncrementalService.updateAllBalances(true);

        expect(accountBalanceRepository.getByAccountId(accountId).get()?.balance).toBe(ANCHOR_BALANCE);
    });
});
