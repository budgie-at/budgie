import {
    AccountDebtTypeEnum,
    AccountEntityInterface,
    AccountNatureEnum,
    DebtAccountCreateInputInterface,
    LiabilityAccountCreateInputInterface,
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
import { microPause } from '../../@generic/utils/micro-pause.util';
import { processInputWithBatches } from '../../@generic/utils/process-input-with-batches.util';
import { transactionService } from '../../transaction/service/transaction.service';

class AccountService {
    async create(input: LiabilityAccountCreateInputInterface): Promise<AccountEntityInterface> {
        return db.transaction(async tx => {
            const [{ count }] = await accountRepository.count();

            const account = await accountRepository.create(
                {
                    ...input,
                    order: count + 1,
                    nature: AccountNatureEnum.LIABILITY
                },
                tx
            );

            await this.adjustBalanceTo(account.id, input.targetBalance, tx);

            if (!isPositiveNumber(count)) {
                await settingsRepository.update({ defaultAccountId: account.id }, tx);
            }

            return account;
        });
    }

    async createDebt(input: DebtAccountCreateInputInterface): Promise<AccountEntityInterface> {
        return db.transaction(async tx => {
            const [{ count }] = await accountRepository.count();

            const account = await accountRepository.create(
                {
                    ...input,
                    parentId: null,
                    order: count + 1,
                    externalId: null,
                    externalSource: null,
                    includeInNetWorth: false,
                    nature: AccountNatureEnum.LIABILITY,
                    targetBalance: convertToMicroUnits(input.targetBalance)
                },
                tx
            );

            const isBorrow = input.debtType === AccountDebtTypeEnum.BORROW;

            await this.adjustBalanceTo(account.id, account.instrumentId, 0, tx);

            const fromAccountId = isBorrow ? account.id : input.accountId;
            const toAccountId = isBorrow ? input.accountId : account.id;

            await microPause();

            await transactionService.createInternal({
                title: '',
                comment: '',
                tagIds: [],
                operatedAt: new Date(),
                type: TransactionTypeEnum.DEBT,
                externalId: null,
                externalSource: null,
                exchangeRate: 1,
                amount: input.targetBalance,
                fromAccountId,
                toAccountId,
                entries: [
                    {
                        categoryId: 1,
                        accountId: toAccountId,
                        amount: input.targetBalance,
                        instrumentId: account.instrumentId,
                        type: TransactionEntryTypeEnum.CREDIT
                    },
                    {
                        categoryId: 1,
                        accountId: fromAccountId,
                        amount: input.targetBalance,
                        instrumentId: account.instrumentId,
                        type: TransactionEntryTypeEnum.DEBIT
                    }
                ]
            });

            return account;
        });
    }

    async bulkCreate(inputs: LiabilityAccountCreateInputInterface[], batchSize = 100): Promise<Record<string, AccountEntityInterface>> {
        const result = await processInputWithBatches(inputs, batchSize, this.processBatch.bind(this));

        return result.reduce<Record<string, AccountEntityInterface>>((acc, account) => ({ ...acc, [account.title]: account }), {});
    }

    async updateById(id: number, input: Partial<LiabilityAccountCreateInputInterface>): Promise<AccountEntityInterface> {
        return db.transaction(async tx => {
            const account = await accountRepository.updateById(id, input, tx);

            if (isNumber(input.targetBalance)) {
                await this.adjustBalanceTo(account.id, input.targetBalance, tx);
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

    private async processBatch(batch: LiabilityAccountCreateInputInterface[]): Promise<AccountEntityInterface[]> {
        return await db.transaction(async tx => {
            const [{ count }] = await accountRepository.count();

            const accounts = await accountRepository.bulkCreate(
                batch.map((input, index) => ({ ...input, order: count + index + 1, nature: AccountNatureEnum.LIABILITY })),
                tx
            );

            await Promise.all(accounts.map((account, index) => this.adjustBalanceTo(account.id, batch[index].targetBalance, tx)));

            return accounts;
        });
    }
}

export const accountService = new AccountService();
