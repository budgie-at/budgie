import {
    AccountCreateEntityInterface,
    AccountEntityInterface,
    AccountUpdateEntityInterface,
    TransactionEntryTypeEnum,
    TransactionTypeEnum
} from '@budgie/contracts';

import { isDefined, isNumber, isPositiveNumber } from '@rnw-community/shared';

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
import { processInputWithBatches } from '../../@generic/utils/process-input-with-batches.util';

class AccountService {
    async create(input: AccountCreateEntityInterface): Promise<AccountEntityInterface> {
        return db.transaction(async tx => {
            const hasAnyAccount = await accountRepository.hasAnyAccount();

            const account = await accountRepository.create(input, tx);

            await this.adjustBalanceTo(account.id, input.currentBalance, tx);

            if (!hasAnyAccount) {
                await settingsRepository.update({ defaultAccountId: account.id }, tx);
            }

            return account;
        });
    }

    async bulkCreate(inputs: AccountCreateEntityInterface[], batchSize = 100): Promise<Record<string, AccountEntityInterface>> {
        const result = await processInputWithBatches(inputs, batchSize, this.processBatch.bind(this));

        return result.reduce<Record<string, AccountEntityInterface>>((acc, account) => ({ ...acc, [account.title]: account }), {});
    }

    async updateById(id: number, input: AccountUpdateEntityInterface): Promise<AccountEntityInterface> {
        return db.transaction(async tx => {
            const account = await accountRepository.updateById(id, input, tx);

            if (isNumber(input.currentBalance)) {
                await this.adjustBalanceTo(account.id, input.currentBalance, tx);
            }

            return account;
        });
    }

    async findByIdOrFail(id: number): Promise<AccountEntityInterface> {
        const account = await accountRepository.findById(id);

        if (!isDefined(account)) {
            // eslint-disable-next-line lingui/no-unlocalized-strings
            throw new Error(`Account with id ${id} not found`);
        }

        return account;
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

    private async adjustBalanceTo(accountId: number, targetBalance: number, tx: Transaction): Promise<void> {
        const result = await accountBalanceRepository.getByAccountId(accountId);
        const currentBalanceMicro = result.at(0)?.balance ?? 0;

        const targetBalanceMicro = convertToMicroUnits(targetBalance);
        const delta = targetBalanceMicro - currentBalanceMicro;

        if (delta === 0) {
            return;
        }

        const isIncome = isPositiveNumber(delta);
        const absDelta = Math.abs(delta);

        await accountBalanceRepository.upsert({ accountId, amount: targetBalanceMicro }, tx);

        const transaction = await transactionRepository.create(
            {
                type: TransactionTypeEnum.ADJUSTMENT,
                title: '',
                comment: '',
                externalId: null,
                externalSource: null,
                operatedAt: new Date(),
                exchangeRate: 1,
                fromAccountId: isIncome ? null : accountId,
                toAccountId: isIncome ? accountId : null
            },
            tx
        );

        await transactionEntryRepository.create(
            {
                accountId,
                transactionId: transaction.id,
                categoryId: null,
                amount: absDelta,
                type: isIncome ? TransactionEntryTypeEnum.CREDIT : TransactionEntryTypeEnum.DEBIT
            },
            tx
        );
    }

    private async processBatch(batch: AccountCreateEntityInterface[]): Promise<AccountEntityInterface[]> {
        return await db.transaction(async tx => {
            const accounts = await accountRepository.bulkCreate(batch, tx);

            await Promise.all(accounts.map((account, index) => this.adjustBalanceTo(account.id, batch[index].currentBalance, tx)));

            return accounts;
        });
    }
}

export const accountService = new AccountService();
