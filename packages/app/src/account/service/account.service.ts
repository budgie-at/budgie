import { AccountDebtTypeEnum, AccountNatureEnum, TransactionEntryTypeEnum, TransactionTypeEnum, transactionAsync } from '@budgie/contracts';

import { isDefined, isNumber, isPositiveNumber } from '@rnw-community/shared';

import {
    accountBalanceRepository,
    accountRepository,
    db,
    settingsRepository,
    transactionEntryRepository,
    transactionRepository
} from '../../@generic/drizzle/db/db';
import { InvalidateDatabaseLiveQuery } from '../../@generic/drizzle/decorator/invalidate-database-live-query.decorator';
import { convertToMicroUnits } from '../../@generic/utils/convert-to-micro-units.util';
import { microPause } from '../../@generic/utils/micro-pause.util';
import { processInputWithBatches } from '../../@generic/utils/process-input-with-batches.util';
import { entryBaseValuationService } from '../../money-data/service/entry-base-valuation.service';
import { unconsolidateByIdInTransaction } from '../../transaction/utils/unconsolidate-by-id-in-transaction.util';

import { accountBalanceIncrementalService } from './account-balance-incremental.service';
import { accountTransferConversionService } from './account-transfer-conversion.service';

import type {
    AccountEntityInterface,
    DB,
    DebtAccountCreateInputInterface,
    LiabilityAccountCreateInputInterface
} from '@budgie/contracts';

class AccountService {
    @InvalidateDatabaseLiveQuery()
    async create(input: LiabilityAccountCreateInputInterface): Promise<AccountEntityInterface> {
        return transactionAsync(db, async tx => {
            const [{ count }] = await accountRepository.count();
            const createdAccount = await this.createLiabilityAccount({ ...input }, count, tx);

            await this.adjustBalanceTo(createdAccount.id, input.currentBalance, tx);

            if (!isPositiveNumber(count)) {
                await settingsRepository.update({ defaultAccountId: createdAccount.id }, tx);
            }

            return createdAccount;
        });
    }

    @InvalidateDatabaseLiveQuery()
    async createDebt(input: DebtAccountCreateInputInterface): Promise<AccountEntityInterface> {
        return transactionAsync(db, async tx => {
            const [{ count }] = await accountRepository.count();
            const operatedAt = new Date();
            const createdAccount = await this.createLiabilityAccount(
                { ...input, targetBalance: convertToMicroUnits(input.targetBalance) },
                count,
                tx
            );
            const valuedAccount = await this.updateDebtTargetBaseValuation(createdAccount, operatedAt, tx);
            const debtBalance = this.getDebtBalanceInput(input.currentBalance, input.debtType);

            await this.adjustBalanceTo(createdAccount.id, debtBalance, tx, operatedAt);

            return valuedAccount;
        });
    }

    @InvalidateDatabaseLiveQuery()
    async updateById(id: number, input: Partial<Omit<LiabilityAccountCreateInputInterface, 'type'>>): Promise<AccountEntityInterface> {
        return transactionAsync(db, async tx => {
            const updatedAccount = await accountRepository.updateById(id, input, tx);

            if (isNumber(input.currentBalance)) {
                await this.adjustBalanceTo(updatedAccount.id, input.currentBalance, tx);
            }

            return updatedAccount;
        });
    }

    @InvalidateDatabaseLiveQuery()
    async updateDebtById(id: number, input: Partial<DebtAccountCreateInputInterface>): Promise<AccountEntityInterface> {
        return transactionAsync(db, async tx => {
            const { currentBalance, targetBalance, ...accountInput } = input;
            const accountUpdateInput = isNumber(targetBalance)
                ? { ...accountInput, targetBalance: convertToMicroUnits(targetBalance) }
                : accountInput;
            const updatedAccount = await accountRepository.updateById(id, accountUpdateInput, tx);
            const shouldUpdateTargetBaseValuation = isNumber(targetBalance) || isNumber(accountInput.instrumentId);
            const valuedAccount = shouldUpdateTargetBaseValuation
                ? await this.updateDebtTargetBaseValuation(updatedAccount, new Date(), tx)
                : updatedAccount;

            if (isNumber(currentBalance)) {
                const debtBalance = this.getDebtBalanceInput(currentBalance, updatedAccount.debtType);

                await this.adjustBalanceTo(updatedAccount.id, debtBalance, tx);
            }

            return valuedAccount;
        });
    }

    @InvalidateDatabaseLiveQuery()
    async archiveById(id: number): Promise<void> {
        await transactionAsync(db, async tx => {
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

    @InvalidateDatabaseLiveQuery()
    async restoreById(id: number): Promise<void> {
        await microPause();

        await transactionAsync(db, async tx => {
            await accountRepository.restoreById(id, tx);
            await transactionEntryRepository.restoreByAccountIds([id], tx);
            await transactionRepository.restoreByAccountIds([id], tx);
        });
    }

    @InvalidateDatabaseLiveQuery()
    async deleteById(id: number): Promise<void> {
        await transactionAsync(db, async tx => {
            await this.unconsolidateActiveAutoByAccountId(id, tx);
            await accountTransferConversionService.convertAccountTransfers(id, tx);
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

    @InvalidateDatabaseLiveQuery()
    async activateById(id: number): Promise<void> {
        await accountRepository.updateById(id, { isActive: true });
    }

    @InvalidateDatabaseLiveQuery((_inputs, tx) => !isDefined(tx))
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

    async findByIdOrFail(id: number): Promise<AccountEntityInterface> {
        const account = await accountRepository.findById(id);

        if (!isDefined(account)) {
            // eslint-disable-next-line lingui/no-unlocalized-strings
            throw new Error(`Account with id ${id} not found`);
        }

        return account;
    }

    private async unconsolidateActiveAutoByAccountId(id: number, tx: DB): Promise<void> {
        const canonicals = await transactionRepository.findActiveAutoConsolidatedByAccountIds([id], tx);
        for (const canonical of canonicals) {
            // eslint-disable-next-line no-await-in-loop -- Sequential unconsolidation must happen before account mutation
            await unconsolidateByIdInTransaction(canonical.id, tx);
        }
    }

    private async adjustBalanceTo(accountId: number, targetBalance: number, tx: DB, operatedAt = new Date()): Promise<void> {
        const result = await accountBalanceRepository.getByAccountId(accountId, tx);
        const targetBalanceMicro = convertToMicroUnits(targetBalance);
        const delta = targetBalanceMicro - (result.at(0)?.balance ?? 0);

        if (delta === 0) {
            return;
        }

        const isIncome = isPositiveNumber(delta);
        const amount = Math.abs(delta);
        const valuation = await entryBaseValuationService.valueMicroUnitEntry({ accountId, amount, operatedAt, externalSource: null, tx });

        const transaction = await transactionRepository.create(
            {
                type: TransactionTypeEnum.ADJUSTMENT,
                title: '',
                comment: '',
                externalId: null,
                externalSource: null,
                operatedAt,
                exchangeRate: valuation.baseExchangeRate ?? 1,
                fromAccountId: isIncome ? null : accountId,
                toAccountId: isIncome ? accountId : null,
                updatedBy: null
            },
            tx
        );

        await transactionEntryRepository.create(
            {
                accountId,
                transactionId: transaction.id,
                categoryId: null,
                mccCategoryId: null,
                amount,
                type: isIncome ? TransactionEntryTypeEnum.DEBIT : TransactionEntryTypeEnum.CREDIT,
                exchangeRate: valuation.baseExchangeRate ?? 1,
                baseInstrumentId: valuation.baseInstrumentId,
                baseExchangeRate: valuation.baseExchangeRate,
                baseAmount: valuation.baseAmount
            },
            tx
        );

        await accountBalanceRepository.upsert({ accountId, amount: targetBalanceMicro, updatedAt: new Date() }, tx);
    }

    private getDebtBalanceInput(currentBalanceInput: number, debtType: AccountDebtTypeEnum): number {
        const currentBalance = Math.abs(currentBalanceInput);

        return debtType === AccountDebtTypeEnum.LENT ? currentBalance : -currentBalance;
    }

    private async updateDebtTargetBaseValuation(
        account: AccountEntityInterface,
        operatedAt: Date,
        tx: DB
    ): Promise<AccountEntityInterface> {
        const valuation = await entryBaseValuationService.valueMicroUnitEntry({
            accountId: account.id,
            amount: account.targetBalance,
            operatedAt,
            externalSource: null,
            tx
        });

        return accountRepository.updateById(
            account.id,
            {
                targetBaseInstrumentId: valuation.baseInstrumentId,
                targetBaseExchangeRate: valuation.baseExchangeRate,
                targetBaseAmount: valuation.baseAmount
            },
            tx
        );
    }

    private async createLiabilityAccount(
        input: Omit<LiabilityAccountCreateInputInterface, 'currentBalance'> & Record<string, unknown>,
        count: number,
        tx: DB
    ): Promise<AccountEntityInterface> {
        return accountRepository.create({ ...input, order: count + 1, nature: AccountNatureEnum.LIABILITY }, tx);
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
