import { isNumber, isPositiveNumber } from '@rnw-community/shared';

import { DB, Transaction } from '../../@generic/type/db.type';
import { convertToMicroUnits } from '../../@generic/util/convert-to-micro-units.util';
import { processInputWithBatches } from '../../@generic/util/process-input-with-batches.util';
import { AccountBalanceRepository } from '../../account-balance/repository/account-balance.repository';
import { SettingsRepository } from '../../settings/repository/settings.repository';
import { TransactionTypeEnum } from '../../transaction/enum/transaction-type.enum';
import { TransactionRepository } from '../../transaction/repository/transaction.repository';
import { TransactionEntryTypeEnum } from '../../transaction-entry/enum/transaction-entry-type.enum';
import { TransactionEntryRepository } from '../../transaction-entry/repository/transaction-entry.repository';
import { AccountCreateEntityInterface } from '../entity/account-create-entity.interface';
import { AccountEntityInterface } from '../entity/account-entity.interface';
import { AccountUpdateEntityInterface } from '../entity/account-update-entity.interface';
import { AccountRepository } from '../repository/account.repository';

export class AccountService {
    accountRepository: AccountRepository;
    settingsRepository: SettingsRepository;
    transactionRepository: TransactionRepository;
    accountBalanceRepository: AccountBalanceRepository;
    transactionEntryRepository: TransactionEntryRepository;

    constructor(private readonly db: DB) {
        this.accountRepository = new AccountRepository(db);
        this.settingsRepository = new SettingsRepository(db);
        this.transactionRepository = new TransactionRepository(db);
        this.accountBalanceRepository = new AccountBalanceRepository(db);
        this.transactionEntryRepository = new TransactionEntryRepository(db);
    }

    async create(input: AccountCreateEntityInterface): Promise<AccountEntityInterface> {
        return this.db.transaction(async tx => {

            const hasAnyAccount = await this.accountRepository.hasAnyAccount();

            const account = await this.accountRepository.create(input, tx);

            await this.adjustBalanceTo(account.id, input.currentBalance, tx);

            if (!hasAnyAccount) {
                await this.settingsRepository.update({ defaultAccountId: account.id }, tx);
            }

            return account;
        });
    }

    async bulkCreate(inputs: AccountCreateEntityInterface[], batchSize = 100): Promise<Record<string, AccountEntityInterface>> {
        const result = await processInputWithBatches(inputs, batchSize, this.processBatch.bind(this));

        return result.reduce<Record<string, AccountEntityInterface>>((acc, account) => ({ ...acc, [account.title]: account }), {});
    }

    async updateById(id: number, input: AccountUpdateEntityInterface): Promise<AccountEntityInterface> {
        return this.db.transaction(async tx => {
            const account = await this.accountRepository.updateById(id, input, tx);

            if (isNumber(input.currentBalance)) {
                await this.adjustBalanceTo(account.id, input.currentBalance, tx);
            }

            return account;
        });
    }

    async archiveById(id: number): Promise<AccountEntityInterface> {
        return this.db.transaction(async tx => {
            const account = await this.accountRepository.archiveById(id, tx);
            const settings = await this.settingsRepository.getSettings();

            if (settings.defaultAccountId === id) {
                await this.settingsRepository.update({ defaultAccountId: null }, tx);
            }

            return account;
        });
    }

    private async adjustBalanceTo(accountId: number, targetBalance: number, tx: Transaction): Promise<void> {
        const result = await this.accountBalanceRepository.getByAccountId(accountId);
        const currentBalanceMicro = result.at(0)?.balance ?? 0;

        const targetBalanceMicro = convertToMicroUnits(targetBalance);
        const delta = targetBalanceMicro - currentBalanceMicro;

        if (delta === 0) {
            return;
        }

        const isDebit = isPositiveNumber(delta);
        const absDelta = Math.abs(delta);

        await this.accountBalanceRepository.upsert({ accountId, amount: targetBalanceMicro, updatedAt: new Date('01.01.1970') }, tx);

        const transaction = await this.transactionRepository.create(
            {
                type: TransactionTypeEnum.ADJUSTMENT,
                title: '',
                comment: '',
                externalId: null,
                externalSource: null,
                operatedAt: new Date(),
                exchangeRate: 1,
                fromAccountId: isDebit ? null : accountId,
                toAccountId: isDebit ? accountId : null
            },
            tx
        );

        await this.transactionEntryRepository.create(
            {
                accountId,
                transactionId: transaction.id,
                categoryId: null,
                amount: absDelta,
                type: isDebit ? TransactionEntryTypeEnum.DEBIT : TransactionEntryTypeEnum.CREDIT
            },
            tx
        );
    }

    private async processBatch(batch: AccountCreateEntityInterface[]): Promise<AccountEntityInterface[]> {
        return await this.db.transaction(async tx => {
            const accounts = await this.accountRepository.bulkCreate(batch, tx);

            await Promise.all(accounts.map((account, index) => this.adjustBalanceTo(account.id, batch[index].currentBalance, tx)));

            return accounts;
        });
    }
}
