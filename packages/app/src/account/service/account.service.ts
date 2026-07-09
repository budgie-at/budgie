import {
    AccountDebtTypeEnum,
    AccountNatureEnum,
    DebtEventDirectionEnum,
    DebtEventSourceEnum,
    TransactionEntryTypeEnum,
    TransactionTypeEnum,
    transactionAsync
} from '@budgie/contracts';

import { isDefined, isNumber, isPositiveNumber } from '@rnw-community/shared';

import {
    accountBalanceRepository,
    accountRepository,
    db,
    debtEventRepository,
    settingsRepository,
    transactionEntryRepository,
    transactionRepository
} from '../../@generic/drizzle/db/db';
import { InvalidateDatabaseLiveQuery } from '../../@generic/drizzle/decorator/invalidate-database-live-query.decorator';
import { convertFromMicroUnits } from '../../@generic/utils/convert-from-micro-units.util';
import { convertToMicroUnits } from '../../@generic/utils/convert-to-micro-units.util';
import { microPause } from '../../@generic/utils/micro-pause.util';
import { processInputWithBatches } from '../../@generic/utils/process-input-with-batches.util';
import { entryBaseValuationService } from '../../money-data/service/entry-base-valuation.service';
import { unconsolidateByIdInTransaction } from '../../transaction/utils/unconsolidate-by-id-in-transaction.util';
import { updateDebtTargetBaseValuation } from '../util/update-debt-target-base-valuation.util';

import { accountBalanceIncrementalService } from './account-balance-incremental.service';
import { accountTransferConversionService } from './account-transfer-conversion.service';

import type { AccountEntityInterface, DB, DebtAccountCreateInputInterface, LiabilityAccountCreateInputInterface } from '@budgie/contracts';

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
            const valuedAccount = await updateDebtTargetBaseValuation(createdAccount, operatedAt, tx);
            const initialCurrentBalance = this.getInitialDebtCurrentBalance(input);
            const debtBalance = this.getDebtBalanceInput(initialCurrentBalance, input.debtType);

            await this.adjustBalanceTo(createdAccount.id, debtBalance, tx, operatedAt);
            await this.syncManualDebtEvents(valuedAccount, initialCurrentBalance, operatedAt, tx);

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
        return transactionAsync(db, async tx => this.updateDebtByIdInTransaction(id, input, tx));
    }

    @InvalidateDatabaseLiveQuery()
    async archiveById(id: number): Promise<void> {
        await transactionAsync(db, async tx => {
            await this.unconsolidateActiveAutoByAccountId(id, tx);

            await accountRepository.archiveById(id, tx);
            await debtEventRepository.archiveByAccountIds([id], tx);
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
            await debtEventRepository.restoreByAccountIds([id], tx);
            await transactionEntryRepository.restoreByAccountIds([id], tx);
            await transactionRepository.restoreByAccountIds([id], tx);
        });
    }

    @InvalidateDatabaseLiveQuery()
    async deleteById(id: number): Promise<void> {
        await transactionAsync(db, async tx => {
            await this.unconsolidateActiveAutoByAccountId(id, tx);
            await accountTransferConversionService.convertAccountTransfers(id, tx);
            await debtEventRepository.deleteByAccountId(id, tx);
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

    private async updateDebtByIdInTransaction(
        id: number,
        input: Partial<DebtAccountCreateInputInterface>,
        tx: DB
    ): Promise<AccountEntityInterface> {
        const { currentBalance } = input;
        const operatedAt = new Date();
        const valuedAccount = await this.updateDebtAccountFields(id, input, operatedAt, tx);

        await this.adjustDebtBalanceIfNeeded(valuedAccount, currentBalance, operatedAt, tx);

        if (this.shouldSyncManualDebtEvents(input)) {
            const currentDebtBalance = isNumber(currentBalance)
                ? currentBalance
                : await this.getManualDebtCurrentBalanceInput(valuedAccount, tx);

            await this.syncManualDebtEvents(valuedAccount, currentDebtBalance, operatedAt, tx);
        }

        return valuedAccount;
    }

    private async updateDebtAccountFields(
        id: number,
        input: Partial<DebtAccountCreateInputInterface>,
        operatedAt: Date,
        tx: DB
    ): Promise<AccountEntityInterface> {
        const { currentBalance: _currentBalance, targetBalance, ...accountInput } = input;
        const accountUpdateInput = isNumber(targetBalance)
            ? { ...accountInput, targetBalance: convertToMicroUnits(targetBalance) }
            : accountInput;
        const updatedAccount = await accountRepository.updateById(id, accountUpdateInput, tx);

        if (isNumber(targetBalance) || isNumber(accountInput.instrumentId)) {
            return updateDebtTargetBaseValuation(updatedAccount, operatedAt, tx);
        }

        return updatedAccount;
    }

    private async adjustDebtBalanceIfNeeded(
        account: AccountEntityInterface,
        currentBalance: number | undefined,
        operatedAt: Date,
        tx: DB
    ): Promise<void> {
        if (!isNumber(currentBalance)) {
            return;
        }

        await this.adjustBalanceTo(account.id, this.getDebtBalanceInput(currentBalance, account.debtType), tx, operatedAt);
    }

    private shouldSyncManualDebtEvents(input: Partial<DebtAccountCreateInputInterface>): boolean {
        return isNumber(input.currentBalance) || isNumber(input.targetBalance) || isNumber(input.instrumentId);
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

    private getInitialDebtCurrentBalance(
        input: Pick<DebtAccountCreateInputInterface, 'currentBalance' | 'debtType' | 'targetBalance'>
    ): number {
        if (input.debtType === AccountDebtTypeEnum.BORROW && !isPositiveNumber(input.currentBalance)) {
            return input.targetBalance;
        }

        return input.currentBalance;
    }

    private async syncManualDebtEvents(
        account: AccountEntityInterface,
        currentBalanceInput: number,
        operatedAt: Date,
        tx: DB
    ): Promise<void> {
        await debtEventRepository.deleteByAccountIdAndSource(account.id, DebtEventSourceEnum.MANUAL, tx);

        if (!isPositiveNumber(account.targetBalance)) {
            return;
        }

        await debtEventRepository.bulkCreate(
            [
                {
                    debtAccountId: account.id,
                    transactionId: null,
                    transactionEntryId: null,
                    direction: DebtEventDirectionEnum.OPEN,
                    source: DebtEventSourceEnum.MANUAL,
                    amount: account.targetBalance,
                    baseInstrumentId: account.targetBaseInstrumentId,
                    baseExchangeRate: account.targetBaseExchangeRate,
                    baseAmount: account.targetBaseAmount,
                    operatedAt
                },
                ...this.getManualDebtCloseEvent(account, currentBalanceInput, operatedAt)
            ],
            tx
        );
    }

    private getManualDebtCloseEvent(account: AccountEntityInterface, currentBalanceInput: number, operatedAt: Date) {
        const amount = this.getManualDebtClosedAmount(account, currentBalanceInput);

        if (!isPositiveNumber(amount)) {
            return [];
        }

        return [
            {
                debtAccountId: account.id,
                transactionId: null,
                transactionEntryId: null,
                direction: DebtEventDirectionEnum.CLOSE,
                source: DebtEventSourceEnum.MANUAL,
                amount,
                baseInstrumentId: account.targetBaseInstrumentId,
                baseExchangeRate: account.targetBaseExchangeRate,
                baseAmount: this.getManualDebtBaseAmount(account, amount),
                operatedAt
            }
        ];
    }

    private getManualDebtClosedAmount(account: AccountEntityInterface, currentBalanceInput: number): number {
        const currentBalance = convertToMicroUnits(Math.abs(currentBalanceInput));

        if (account.debtType === AccountDebtTypeEnum.LENT) {
            return Math.min(currentBalance, account.targetBalance);
        }

        return Math.max(account.targetBalance - currentBalance, 0);
    }

    private getManualDebtBaseAmount(account: AccountEntityInterface, amount: number): number | null {
        if (!isDefined(account.targetBaseExchangeRate)) {
            return null;
        }

        return Math.round(amount * account.targetBaseExchangeRate);
    }

    private async getManualDebtCurrentBalanceInput(account: AccountEntityInterface, tx: DB): Promise<number> {
        const manualDebtEvents = await debtEventRepository.findByAccountIdAndSource(account.id, DebtEventSourceEnum.MANUAL, tx);
        const closedAmount = manualDebtEvents.reduce(
            (sum, event) => (event.direction === DebtEventDirectionEnum.CLOSE ? sum + event.amount : sum),
            0
        );

        if (account.debtType === AccountDebtTypeEnum.LENT) {
            return convertFromMicroUnits(closedAmount);
        }

        return convertFromMicroUnits(Math.max(account.targetBalance - closedAmount, 0));
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
