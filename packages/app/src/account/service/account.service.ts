import {
    AccountDebtTypeEnum,
    AccountNatureEnum,
    Db,
    DebtEventDirectionEnum,
    DebtEventSourceEnum,
    getDebtClosedAmount
} from '@budgie/contracts';
import * as Effect from 'effect/Effect';

import { isDefined, isNumber, isPositiveNumber } from '@rnw-community/shared';

import {
    accountBalanceRepository,
    accountRepository,
    debtEventRepository,
    settingsRepository,
    transactionEntryRepository,
    transactionRepository
} from '../../@generic/drizzle/db/db';
import { invalidateDatabaseLiveQuery } from '../../@generic/drizzle/utils/invalidate-database-live-query.util';
import { Workload } from '../../@generic/service/workload.service';
import { convertToMicroUnits } from '../../@generic/utils/convert-to-micro-units.util';
import { microPause } from '../../@generic/utils/micro-pause.util';
import { processInputWithBatches } from '../../@generic/utils/process-input-with-batches.util';
import { transactionService } from '../../transaction/service/transaction.service';
import { unconsolidateByIdInTransaction } from '../../transaction/utils/unconsolidate-by-id-in-transaction.util';
import { AccountNotFoundError } from '../error/account-not-found.error';
import { updateDebtTargetBaseValuation } from '../util/update-debt-target-base-valuation.util';

import { accountBalanceIncrementalService } from './account-balance-incremental.service';
import { accountTransferConversionService } from './account-transfer-conversion.service';

import type {
    AccountEntityInterface,
    DebtAccountCreateInputInterface,
    DebtEventEntityInterface,
    DepositAccountCreateInputInterface,
    LiabilityAccountCreateInputInterface
} from '@budgie/contracts';

class AccountService {
    private static readonly UNCONSOLIDATION_BATCH_SIZE = 25;

    readonly create = Effect.fn('AccountService.create')(
        function* (this: AccountService, input: LiabilityAccountCreateInputInterface) {
            const [{ count }] = yield* Db.query(() => accountRepository.count());
            const createdAccount = yield* this.createAccountRecord({ ...input }, count);

            yield* this.adjustBalanceTo(createdAccount.id, input.currentBalance);

            if (!isPositiveNumber(count)) {
                yield* settingsRepository.update({ defaultAccountId: createdAccount.id });
            }

            return createdAccount;
        },
        effect => Db.transaction(effect),
        invalidateDatabaseLiveQuery
    );

    readonly createDebt = Effect.fn('AccountService.createDebt')(
        function* (this: AccountService, input: DebtAccountCreateInputInterface) {
            const [{ count }] = yield* Db.query(() => accountRepository.count());
            const operatedAt = new Date();
            const targetBalance = convertToMicroUnits(input.targetBalance);
            const createdAccount = yield* this.createAccountRecord({ ...input, targetBalance }, count, this.getDebtNature(input.debtType));
            const valuedAccount = yield* updateDebtTargetBaseValuation(createdAccount, operatedAt);
            const returnedAmount = convertToMicroUnits(input.currentBalance);

            yield* this.syncManualDebtEvents(valuedAccount, returnedAmount, operatedAt);
            yield* accountBalanceIncrementalService.updateBalancesByAccountIds([valuedAccount.id]);

            return valuedAccount;
        },
        effect => Db.transaction(effect),
        invalidateDatabaseLiveQuery
    );

    readonly createDeposit = Effect.fn('AccountService.createDeposit')(
        function* (this: AccountService, input: DepositAccountCreateInputInterface) {
            const [{ count }] = yield* Db.query(() => accountRepository.count());
            const createdAccount = yield* this.createAccountRecord(input, count, AccountNatureEnum.ASSET);

            yield* this.adjustBalanceTo(createdAccount.id, input.currentBalance);

            return createdAccount;
        },
        effect => Db.transaction(effect),
        invalidateDatabaseLiveQuery
    );

    readonly updateById = Effect.fn('AccountService.updateById')(
        function* (this: AccountService, id: number, input: Partial<Omit<LiabilityAccountCreateInputInterface, 'type'>>) {
            const updatedAccount = yield* accountRepository.updateById(id, input);

            if (isNumber(input.currentBalance)) {
                yield* this.adjustBalanceTo(updatedAccount.id, input.currentBalance);
            }

            return updatedAccount;
        },
        effect => Db.transaction(effect),
        invalidateDatabaseLiveQuery
    );

    readonly updateDebtById = Effect.fn('AccountService.updateDebtById')(
        function* (this: AccountService, id: number, input: Partial<DebtAccountCreateInputInterface>) {
            const { currentBalance } = input;
            const operatedAt = new Date();
            const valuedAccount = yield* this.updateDebtAccountFields(id, input, operatedAt);

            if (!this.shouldSyncManualDebtEvents(input)) {
                return valuedAccount;
            }

            const returnedAmount = isNumber(currentBalance)
                ? convertToMicroUnits(currentBalance)
                : yield* this.getDebtReturnedAmount(valuedAccount);

            yield* this.syncManualDebtEvents(valuedAccount, returnedAmount, operatedAt);
            yield* accountBalanceIncrementalService.updateBalancesByAccountIds([valuedAccount.id]);

            return valuedAccount;
        },
        effect => Db.transaction(effect),
        invalidateDatabaseLiveQuery
    );

    readonly updateDepositById = Effect.fn('AccountService.updateDepositById')(
        function* (
            this: AccountService,
            id: number,
            input: Partial<
                Pick<
                    DepositAccountCreateInputInterface,
                    'title' | 'icon' | 'currentBalance' | 'interestRate' | 'deadline' | 'includeInNetWorth' | 'isActive'
                >
            >
        ) {
            const { currentBalance, ...accountInput } = input;
            const updatedAccount = yield* accountRepository.updateById(id, accountInput);

            if (isNumber(currentBalance)) {
                yield* this.adjustBalanceTo(updatedAccount.id, currentBalance);
            }

            return updatedAccount;
        },
        effect => Db.transaction(effect),
        invalidateDatabaseLiveQuery
    );

    readonly archiveById = Effect.fn('AccountService.archiveById')(function* (this: AccountService, id: number) {
        yield* Effect.promise(() => microPause());

        const workload = yield* Workload;
        yield* workload.runForeground(Db.transaction(this.archiveByIdInTransaction(id)));
    }, invalidateDatabaseLiveQuery);

    readonly restoreById = Effect.fn('AccountService.restoreById')(function* (id: number) {
        yield* Effect.promise(() => microPause());

        yield* Db.transaction(
            Effect.gen(function* () {
                yield* accountRepository.restoreById(id);
                yield* debtEventRepository.restoreByAccountIds([id]);
                yield* transactionEntryRepository.restoreByAccountIds([id]);
                yield* transactionRepository.restoreByAccountIds([id]);
            })
        );
    }, invalidateDatabaseLiveQuery);

    readonly deleteById = Effect.fn('AccountService.deleteById')(
        function* (this: AccountService, id: number) {
            yield* this.unconsolidateActiveAutoByAccountId(id);
            yield* accountTransferConversionService.convertAccountTransfers(id);
            yield* debtEventRepository.deleteByAccountId(id);
            yield* transactionEntryRepository.deleteByAccountId(id);
            yield* transactionRepository.deleteByAccountId(id);

            const settings = yield* settingsRepository.getSettings();
            if (settings.defaultAccountId === id) {
                yield* settingsRepository.update({ defaultAccountId: null });
            }

            yield* accountRepository.deleteById(id);
            yield* accountBalanceIncrementalService.updateAllBalances(true);
        },
        effect => Db.transaction(effect),
        invalidateDatabaseLiveQuery
    );

    readonly activateById = Effect.fn('AccountService.activateById')(function* (id: number) {
        yield* accountRepository.updateById(id, { isActive: true });
    }, invalidateDatabaseLiveQuery);

    readonly bulkCreate = Effect.fn('AccountService.bulkCreate')(function* (
        this: AccountService,
        inputs: LiabilityAccountCreateInputInterface[],
        batchSize: number = 100
    ) {
        const result = yield* processInputWithBatches(inputs, batchSize, batch => this.processBatch(batch));

        return result.reduce<Record<string, AccountEntityInterface>>((acc, account) => ({ ...acc, [account.title]: account }), {});
    }, invalidateDatabaseLiveQuery);

    readonly findByIdOrFail = Effect.fn('AccountService.findByIdOrFail')(function* (id: number) {
        const account = yield* Db.query(db => accountRepository.findById(id, db));

        if (!isDefined(account)) {
            return yield* new AccountNotFoundError({ id });
        }

        return account;
    });

    readonly findByIdIncludingArchivedOrFail = Effect.fn('AccountService.findByIdIncludingArchivedOrFail')(function* (id: number) {
        const account = yield* accountRepository.findByIdIncludingArchived(id);

        if (!isDefined(account)) {
            return yield* new AccountNotFoundError({ id });
        }

        return account;
    });

    readonly archiveByIdInTransaction = Effect.fn('AccountService.archiveByIdInTransaction')(function* (this: AccountService, id: number) {
        yield* this.unconsolidateActiveAutoByAccountId(id);

        yield* accountRepository.archiveById(id);
        yield* debtEventRepository.archiveByAccountIds([id]);
        yield* transactionEntryRepository.archiveByAccountIds([id]);
        yield* transactionRepository.archiveByAccountIds([id]);

        const settings = yield* settingsRepository.getSettings();
        if (settings.defaultAccountId === id) {
            yield* settingsRepository.update({ defaultAccountId: null });
        }
    });

    readonly syncManualDebtEvents = Effect.fn('AccountService.syncManualDebtEvents')(function* (
        this: AccountService,
        account: AccountEntityInterface,
        returnedAmount: number,
        operatedAt: Date
    ) {
        const debtEvents = yield* debtEventRepository.findByAccountId(account.id);
        const manualDebtEvents = debtEvents.filter(debtEvent => debtEvent.source === DebtEventSourceEnum.MANUAL);
        const openedAmount = isPositiveNumber(account.targetBalance) ? account.targetBalance : 0;
        const transactionOpenedAmount = debtEvents.reduce(
            (sum, debtEvent) =>
                debtEvent.source !== DebtEventSourceEnum.MANUAL && debtEvent.direction === DebtEventDirectionEnum.OPEN
                    ? sum + debtEvent.amount
                    : sum,
            0
        );

        const manualOpenedAmount = Math.max(openedAmount - transactionOpenedAmount, 0);

        yield* this.upsertManualDebtEvent(account, manualDebtEvents, DebtEventDirectionEnum.OPEN, manualOpenedAmount, operatedAt);
        yield* this.upsertManualDebtEvent(
            account,
            manualDebtEvents,
            DebtEventDirectionEnum.CLOSE,
            getDebtClosedAmount(returnedAmount, transactionOpenedAmount + manualOpenedAmount),
            operatedAt
        );
    });

    private readonly unconsolidateActiveAutoByAccountId = Effect.fn('AccountService.unconsolidateActiveAutoByAccountId')(function* (
        id: number
    ) {
        const canonicals = yield* transactionRepository.findActiveAutoConsolidatedByAccountIds([id]);

        yield* processInputWithBatches(canonicals, AccountService.UNCONSOLIDATION_BATCH_SIZE, batch =>
            Effect.forEach(batch, canonical => unconsolidateByIdInTransaction(canonical.id), { discard: true }).pipe(Effect.as(null))
        );
    });

    private readonly updateDebtAccountFields = Effect.fn('AccountService.updateDebtAccountFields')(function* (
        id: number,
        input: Partial<DebtAccountCreateInputInterface>,
        operatedAt: Date
    ) {
        const { currentBalance: _currentBalance, targetBalance, ...accountInput } = input;
        const accountUpdateInput = isNumber(targetBalance)
            ? { ...accountInput, targetBalance: convertToMicroUnits(targetBalance) }
            : accountInput;
        const updatedAccount = yield* accountRepository.updateById(id, accountUpdateInput);

        if (isNumber(targetBalance) || isNumber(accountInput.instrumentId)) {
            return yield* updateDebtTargetBaseValuation(updatedAccount, operatedAt);
        }

        return updatedAccount;
    });

    private readonly adjustBalanceTo = Effect.fn('AccountService.adjustBalanceTo')(function* (
        accountId: number,
        targetBalance: number,
        operatedAt: Date = new Date()
    ) {
        const result = yield* Db.query(db => accountBalanceRepository.getByAccountId(accountId, db));
        const targetBalanceMicro = convertToMicroUnits(targetBalance);
        const delta = targetBalanceMicro - (result.at(0)?.balance ?? 0);

        if (delta === 0) {
            return;
        }

        yield* transactionService.createBalanceAdjustment(accountId, delta, operatedAt);

        yield* accountBalanceRepository.upsert({ accountId, amount: targetBalanceMicro });
    });

    // eslint-disable-next-line @typescript-eslint/max-params -- Existing private orchestration keeps positional arguments
    private readonly upsertManualDebtEvent = Effect.fn('AccountService.upsertManualDebtEvent')(function* (
        this: AccountService,
        account: AccountEntityInterface,
        manualDebtEvents: DebtEventEntityInterface[],
        direction: DebtEventDirectionEnum,
        amount: number,
        operatedAt: Date
    ) {
        const [currentDebtEvent, ...duplicateDebtEvents] = manualDebtEvents.filter(debtEvent => debtEvent.direction === direction);

        yield* debtEventRepository.deleteByIds(duplicateDebtEvents.map(debtEvent => debtEvent.id));

        if (!isPositiveNumber(amount)) {
            yield* debtEventRepository.deleteByIds(isDefined(currentDebtEvent) ? [currentDebtEvent.id] : []);

            return;
        }

        const fields = {
            amount,
            baseInstrumentId: account.targetBaseInstrumentId,
            baseExchangeRate: account.targetBaseExchangeRate,
            baseAmount: this.getManualDebtBaseAmount(account, amount),
            operatedAt
        };

        if (isDefined(currentDebtEvent)) {
            yield* debtEventRepository.updateById(currentDebtEvent.id, fields);

            return;
        }

        yield* debtEventRepository.create({
            debtAccountId: account.id,
            transactionId: null,
            transactionEntryId: null,
            direction,
            source: DebtEventSourceEnum.MANUAL,
            ...fields
        });
    });

    private readonly getDebtReturnedAmount = Effect.fn('AccountService.getDebtReturnedAmount')(function* (account: AccountEntityInterface) {
        const manualDebtEvents = yield* debtEventRepository.findByAccountIdAndSource(account.id, DebtEventSourceEnum.MANUAL);

        return manualDebtEvents.reduce(
            (sum, debtEvent) => (debtEvent.direction === DebtEventDirectionEnum.CLOSE ? sum + debtEvent.amount : sum),
            0
        );
    });

    private readonly createAccountRecord = Effect.fn('AccountService.createAccountRecord')(function* (
        input: Omit<LiabilityAccountCreateInputInterface, 'currentBalance'> & Record<string, unknown>,
        count: number,
        nature: AccountNatureEnum = AccountNatureEnum.LIABILITY
    ) {
        return yield* accountRepository.create({ ...input, order: count + 1, nature });
    });

    private readonly processBatch = Effect.fn('AccountService.processBatch')(
        function* (this: AccountService, batch: LiabilityAccountCreateInputInterface[]) {
            const [{ count }] = yield* Db.query(() => accountRepository.count());
            const accounts = yield* accountRepository.bulkCreate(
                batch.map((input, index) => ({ ...input, order: count + index + 1, nature: AccountNatureEnum.LIABILITY }))
            );

            yield* Effect.all(
                accounts.map((account, index) => this.adjustBalanceTo(account.id, batch[index].currentBalance)),
                { concurrency: 'unbounded' }
            );

            return accounts;
        },
        effect => Db.transaction(effect)
    );

    private getDebtNature(debtType: AccountDebtTypeEnum): AccountNatureEnum {
        return debtType === AccountDebtTypeEnum.LENT ? AccountNatureEnum.ASSET : AccountNatureEnum.LIABILITY;
    }

    private shouldSyncManualDebtEvents(input: Partial<DebtAccountCreateInputInterface>): boolean {
        return isNumber(input.currentBalance) || isNumber(input.targetBalance) || isNumber(input.instrumentId);
    }

    private getManualDebtBaseAmount(account: AccountEntityInterface, amount: number): number | null {
        if (!isDefined(account.targetBaseExchangeRate)) {
            return null;
        }

        return Math.round(amount * account.targetBaseExchangeRate);
    }
}

export const accountService = new AccountService();
