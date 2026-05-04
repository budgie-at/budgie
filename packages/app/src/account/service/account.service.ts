import {
    AccountEntityInterface,
    AccountNatureEnum,
    DebtAccountCreateInputInterface,
    LiabilityAccountCreateInputInterface,
    TransactionEntryCreateEntityInterface,
    TransactionEntryTypeEnum,
    TransactionTypeEnum,
    TransactionWithEntriesEntityInterface,
    transactionAsync
} from '@budgie/contracts';

import { isDefined, isNotEmptyArray, isNumber, isPositiveNumber } from '@rnw-community/shared';

import {
    accountBalanceRepository,
    accountRepository,
    db,
    settingsRepository,
    transactionEntryRepository,
    transactionRepository
} from '../../@generic/drizzle/db/db';
import { convertToMicroUnits } from '../../@generic/utils/convert-to-micro-units.util';
import { microPause } from '../../@generic/utils/micro-pause.util';
import { processInputWithBatches } from '../../@generic/utils/process-input-with-batches.util';
import { unconsolidateByIdInTransaction } from '../../transaction/utils/unconsolidate-by-id-in-transaction.util';

import { accountBalanceIncrementalService } from './account-balance-incremental.service';

import type { DB } from '@budgie/contracts';

class AccountService {
    async create(input: LiabilityAccountCreateInputInterface): Promise<AccountEntityInterface> {
        return transactionAsync(db, async tx => {
            const [{ count }] = await accountRepository.count();
            const account = await this.createLiabilityAccount({ ...input }, count, tx);

            await this.adjustBalanceTo(account.id, input.currentBalance, tx);

            if (!isPositiveNumber(count)) {
                await settingsRepository.update({ defaultAccountId: account.id }, tx);
            }

            return account;
        });
    }

    async createDebt(input: DebtAccountCreateInputInterface): Promise<AccountEntityInterface> {
        return transactionAsync(db, async tx => {
            const [{ count }] = await accountRepository.count();
            const account = await this.createLiabilityAccount(
                { ...input, targetBalance: convertToMicroUnits(input.targetBalance) },
                count,
                tx
            );

            await this.adjustBalanceTo(account.id, input.currentBalance, tx);

            return account;
        });
    }

    async bulkCreate(
        inputs: LiabilityAccountCreateInputInterface[],
        tx?: DB,
        batchSize = 100
    ): Promise<Record<string, AccountEntityInterface>> {
        const batchProcessor = isDefined(tx)
            ? (batch: LiabilityAccountCreateInputInterface[]) => this.processBatchInner(batch, tx)
            : this.processBatch.bind(this);
        const result = await processInputWithBatches(inputs, batchSize, batchProcessor);

        return result.reduce<Record<string, AccountEntityInterface>>((acc, account) => ({ ...acc, [account.title]: account }), {});
    }

    async updateById(id: number, input: Partial<Omit<LiabilityAccountCreateInputInterface, 'type'>>): Promise<AccountEntityInterface> {
        return transactionAsync(db, async tx => {
            const account = await accountRepository.updateById(id, input, tx);

            if (isNumber(input.currentBalance)) {
                await this.adjustBalanceTo(account.id, input.currentBalance, tx);
            }

            return account;
        });
    }

    async updateDebtById(id: number, input: Partial<DebtAccountCreateInputInterface>): Promise<AccountEntityInterface> {
        return transactionAsync(db, async tx => {
            const account = await accountRepository.updateById(
                id,
                // eslint-disable-next-line no-undefined
                { ...input, targetBalance: isNumber(input.targetBalance) ? convertToMicroUnits(input.targetBalance) : undefined },
                tx
            );

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

    async archiveById(id: number): Promise<void> {
        return transactionAsync(db, async tx => {
            await this.unconsolidateActiveAutoByAccountId(id, tx);

            await accountRepository.archiveById(id, tx);
            await transactionEntryRepository.archiveByAccountIds([id], tx);
            await transactionRepository.archiveByAccountIds([id], tx);

            const settings = await settingsRepository.getSettings();
            if (settings.defaultAccountId === id) {
                await settingsRepository.update({ defaultAccountId: null }, tx);
            }
        });
    }

    async restoreById(id: number): Promise<void> {
        await microPause();

        return transactionAsync(db, async tx => {
            await accountRepository.restoreById(id, tx);
            await transactionEntryRepository.restoreByAccountIds([id], tx);
            await transactionRepository.restoreByAccountIds([id], tx);
        });
    }

    async deleteById(id: number): Promise<void> {
        return transactionAsync(db, async tx => {
            await this.unconsolidateActiveAutoByAccountId(id, tx);
            await this.convertAccountTransfers(id, tx);
            await transactionEntryRepository.deleteByAccountId(id, tx);
            await transactionRepository.deleteByAccountId(id, tx);

            const settings = await settingsRepository.getSettings();
            if (settings.defaultAccountId === id) {
                await settingsRepository.update({ defaultAccountId: null }, tx);
            }

            await accountRepository.deleteById(id, tx);
            await accountBalanceIncrementalService.updateAllBalances(true, tx);
        });
    }

    async activateById(id: number): Promise<void> {
        await accountRepository.updateById(id, { isActive: true });
    }

    private async unconsolidateActiveAutoByAccountId(id: number, tx: DB): Promise<void> {
        const canonicals = await transactionRepository.findActiveAutoConsolidatedByAccountIds([id], tx);
        for (const canonical of canonicals) {
            // eslint-disable-next-line no-await-in-loop -- Sequential unconsolidation must happen before account mutation
            await unconsolidateByIdInTransaction(canonical.id, tx);
        }
    }

    private async convertAccountTransfers(accountId: number, tx: DB): Promise<void> {
        const transfers = await transactionRepository.findTransfersForConversion(accountId, tx);

        if (!isNotEmptyArray(transfers)) {
            return;
        }

        await transactionRepository.convertTransfersFromAccountToIncome(accountId, tx);
        await transactionRepository.convertTransfersToAccountToExpense(accountId, tx);

        const entriesToCreate = this.collectTransferEntries(transfers, accountId);
        const transactionIds = transfers.map(t => t.id);

        await transactionEntryRepository.deleteByTransactionIds(transactionIds, tx);

        if (isNotEmptyArray(entriesToCreate)) {
            await transactionEntryRepository.bulkCreate(entriesToCreate, tx);
        }
    }

    private collectTransferEntries(transfers: TransactionWithEntriesEntityInterface[], accountId: number) {
        const entriesToCreate: TransactionEntryCreateEntityInterface[] = [];

        for (const transfer of transfers) {
            const isFromDeleted = transfer.fromAccountId === accountId;

            if (isFromDeleted) {
                const debitEntry = transfer.entries.find(entry => entry.type === TransactionEntryTypeEnum.DEBIT);
                if (isDefined(debitEntry) && isDefined(transfer.toAccountId)) {
                    entriesToCreate.push({
                        ...debitEntry,
                        transactionId: transfer.id,
                        accountId: transfer.toAccountId,
                        type: TransactionEntryTypeEnum.DEBIT
                    });
                }
            } else {
                const creditEntry = transfer.entries.find(entry => entry.type === TransactionEntryTypeEnum.CREDIT);
                if (isDefined(creditEntry) && isDefined(transfer.fromAccountId)) {
                    entriesToCreate.push({
                        ...creditEntry,
                        transactionId: transfer.id,
                        accountId: transfer.fromAccountId,
                        type: TransactionEntryTypeEnum.CREDIT
                    });
                }
            }
        }

        return entriesToCreate;
    }

    private async adjustBalanceTo(accountId: number, targetBalance: number, tx: DB): Promise<void> {
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
                mccCategoryId: null,
                amount: absDelta,
                type: isIncome ? TransactionEntryTypeEnum.DEBIT : TransactionEntryTypeEnum.CREDIT
            },
            tx
        );
    }

    private async createLiabilityAccount(
        input: Omit<LiabilityAccountCreateInputInterface, 'currentBalance'> & Record<string, unknown>,
        count: number,
        tx: DB
    ): Promise<AccountEntityInterface> {
        return accountRepository.create(
            {
                ...input,
                order: count + 1,
                nature: AccountNatureEnum.LIABILITY
            },
            tx
        );
    }

    private async processBatch(batch: LiabilityAccountCreateInputInterface[]): Promise<AccountEntityInterface[]> {
        return await transactionAsync(db, async tx => this.processBatchInner(batch, tx));
    }

    private async processBatchInner(batch: LiabilityAccountCreateInputInterface[], tx: DB): Promise<AccountEntityInterface[]> {
        const [{ count }] = await accountRepository.count();

        const accounts = await accountRepository.bulkCreate(
            batch.map((input, index) => ({ ...input, order: count + index + 1, nature: AccountNatureEnum.LIABILITY })),
            tx
        );

        await Promise.all(accounts.map((account, index) => this.adjustBalanceTo(account.id, batch[index].currentBalance, tx)));

        return accounts;
    }
}

export const accountService = new AccountService();
