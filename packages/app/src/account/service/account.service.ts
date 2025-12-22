import {
    AccountCreateEntityInterface,
    AccountEntityInterface,
    AccountUpdateEntityInterface,
    TransactionEntryTypeEnum,
    TransactionTypeEnum
} from '@budgie/contracts';

import { isNumber } from '@rnw-community/shared';

import {
    accountBalanceRepository,
    accountRepository,
    db,
    settingsRepository,
    transactionEntryRepository,
    transactionRepository
} from '../../@generic/drizzle/db/db';
import { Transaction } from '../../@generic/type/transaction.type';
import { convertToMicroUnits } from '../../@generic/utils/convert-to-micro-units.util';

class AccountService {
    async create(input: AccountCreateEntityInterface): Promise<AccountEntityInterface> {
        return db.transaction(async tx => {
            const hasAnyAccount = await accountRepository.hasAnyAccount();

            const account = await accountRepository.create(input, tx);

            await this.adjustBalanceTo(account.id, account.instrumentId, input.currentBalance, tx);

            if (!hasAnyAccount) {
                await settingsRepository.update({ defaultAccountId: account.id }, tx);
            }

            return account;
        });
    }

    async bulkCreate(inputs: AccountCreateEntityInterface[], batchSize = 100): Promise<Record<string, AccountEntityInterface>> {
        const results: AccountEntityInterface[] = [];
        for (let i = 0; i < inputs.length; i += batchSize) {
            const batch = inputs.slice(i, i + batchSize);

            // eslint-disable-next-line no-await-in-loop
            results.push(...(await this.processBatch(batch)));
        }

        return results.reduce<Record<string, AccountEntityInterface>>((acc, account) => ({ ...acc, [account.title]: account }), {});
    }

    async updateById(id: number, input: AccountUpdateEntityInterface): Promise<AccountEntityInterface> {
        return db.transaction(async tx => {
            const account = await accountRepository.updateById(id, input, tx);

            if (isNumber(input.currentBalance)) {
                await this.adjustBalanceTo(account.id, account.instrumentId, input.currentBalance, tx);
            }

            return account;
        });
    }

    async archiveById(id: number): Promise<AccountEntityInterface> {
        return db.transaction(async tx => {
            const account = await accountRepository.archiveById(id, tx);
            const settings = await settingsRepository.getSettings();

            if (settings.defaultAccountId === id) {
                await settingsRepository.update({ defaultAccountId: null }, tx);
            }

            return account;
        });
    }

    private async adjustBalanceTo(accountId: number, instrumentId: number, targetBalance: number, tx: Transaction): Promise<void> {
        const result = await accountBalanceRepository.getByAccountId(accountId);
        const currentBalanceMicro = result.at(0)?.balance ?? 0;

        const targetBalanceMicro = convertToMicroUnits(targetBalance);
        const delta = targetBalanceMicro - currentBalanceMicro;

        if (delta === 0) {
            return;
        }

        const isDebit = delta > 0;
        const absDelta = Math.abs(delta);

        await accountBalanceRepository.upsert({ accountId, amount: targetBalanceMicro, updatedAt: new Date('01.01.1970') }, tx);

        const transaction = await transactionRepository.create(
            {
                type: TransactionTypeEnum.ADJUSTMENT,
                title: '',
                comment: '',
                externalId: null,
                externalSource: null,
                operatedAt: new Date(),
                amount: absDelta,
                exchangeRate: 1,
                tagIds: [],
                entries: [],
                fromAccountId: isDebit ? null : accountId,
                toAccountId: isDebit ? accountId : null
            },
            tx
        );

        await transactionEntryRepository.create(
            {
                accountId,
                instrumentId,
                transactionId: transaction.id,
                categoryId: null,
                amount: absDelta,
                type: isDebit ? TransactionEntryTypeEnum.DEBIT : TransactionEntryTypeEnum.CREDIT
            },
            tx
        );
    }

    private async processBatch(batch: AccountCreateEntityInterface[]): Promise<AccountEntityInterface[]> {
        return await db.transaction(async tx => {
            const accounts = await accountRepository.bulkCreate(batch, tx);

            await Promise.all(
                accounts.map((account, index) => this.adjustBalanceTo(account.id, account.instrumentId, batch[index].currentBalance, tx))
            );

            return accounts;
        });
    }
}

export const accountService = new AccountService();
