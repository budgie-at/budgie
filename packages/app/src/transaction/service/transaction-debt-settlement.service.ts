import {
    AccountDebtTypeEnum,
    AccountTypeEnum,
    BORROWING_CATEGORY_ID,
    CategorySourceEnum,
    DebtEventDirectionEnum,
    DebtEventSourceEnum,
    LENDING_CATEGORY_ID,
    Db,
    TransactionEntryKindEnum,
    TransactionTypeEnum
} from '@budgie/contracts';
import { t } from '@lingui/core/macro';
import * as Effect from 'effect/Effect';

import { isDefined } from '@rnw-community/shared';

import {
    accountRepository,
    categoryRepository,
    debtEventRepository,
    transactionEntryRepository,
    transactionRepository
} from '../../@generic/drizzle/db/db';
import { invalidateDatabaseLiveQuery } from '../../@generic/drizzle/utils/invalidate-database-live-query.util';
import { accountBalanceIncrementalService } from '../../account/service/account-balance-incremental.service';
import { exchangeRatesService } from '../../exchange-rate/service/exchange-rates.service';
import { entryBaseValuationService } from '../../money-data/service/entry-base-valuation.service';
import { getTransactionCategoryEntries } from '../utils/get-transaction-category-entries.util';

import type { AttachDebtSettlementParamsInterface } from '../interface/attach-debt-settlement-params.interface';
import type { AccountEntityInterface, TransactionEntryEntityInterface, TransactionWithEntriesEntityInterface } from '@budgie/contracts';

class TransactionDebtSettlementService {
    readonly attach = Effect.fn('TransactionDebtSettlementService.attach')(
        function* (this: TransactionDebtSettlementService, params: AttachDebtSettlementParamsInterface) {
            return yield* this.attachInTransaction(params);
        },
        effect => Db.transaction(effect),
        invalidateDatabaseLiveQuery
    );

    readonly detach = Effect.fn('TransactionDebtSettlementService.detach')(
        function* (this: TransactionDebtSettlementService, transactionId: number) {
            const transaction = yield* this.getTransactionOrFail(transactionId);
            const debtEvent = yield* debtEventRepository.findByTransactionId(transactionId);

            yield* debtEventRepository.deleteByTransactionId(transactionId);
            yield* this.revertDebtPaymentCategory(transaction);
            yield* transactionRepository.touchUpdatedAt(transactionId);
            yield* accountBalanceIncrementalService.updateBalancesByAccountIds(
                [transaction.toAccountId, transaction.fromAccountId, isDefined(debtEvent) ? debtEvent.debtAccountId : null].filter(
                    isDefined
                )
            );
        },
        effect => Db.transaction(effect),
        invalidateDatabaseLiveQuery
    );

    readonly resyncInTransaction = Effect.fn('TransactionDebtSettlementService.resyncInTransaction')(function* (
        this: TransactionDebtSettlementService,
        transactionId: number
    ) {
        const debtEvent = yield* debtEventRepository.findByTransactionId(transactionId);

        if (!isDefined(debtEvent) || debtEvent.source !== DebtEventSourceEnum.INCOME_ATTACHMENT) {
            return;
        }

        const transaction = yield* this.getTransactionOrFail(transactionId);
        const debtAccount = yield* this.getDebtAccountOrFail(debtEvent.debtAccountId);

        yield* this.assertTransactionSupportsDebtSettlement(transaction);
        const primaryEntry = yield* this.getPrimaryEntryOrFail(transaction);
        yield* this.assertDebtAccountIsNotPrimaryAccount(primaryEntry, debtAccount);

        const fields = yield* this.buildSettlementEventFields(transaction, debtAccount, primaryEntry);

        yield* debtEventRepository.updateById(debtEvent.id, fields);
        yield* accountBalanceIncrementalService.updateBalancesByAccountIds([primaryEntry.accountId, debtAccount.id]);
    });

    readonly attachInTransaction = Effect.fn('TransactionDebtSettlementService.attachInTransaction')(function* (
        this: TransactionDebtSettlementService,
        params: AttachDebtSettlementParamsInterface
    ) {
        const transaction = yield* this.getTransactionOrFail(params.transactionId);
        const debtAccount = yield* this.getDebtAccountOrFail(params.debtAccountId);

        yield* this.assertTransactionSupportsDebtSettlement(transaction);
        yield* this.assertNoSettlement(transaction);
        const primaryEntry = yield* this.getPrimaryEntryOrFail(transaction);
        yield* this.assertDebtAccountIsNotPrimaryAccount(primaryEntry, debtAccount);

        const fields = yield* this.buildSettlementEventFields(transaction, debtAccount, primaryEntry);

        yield* debtEventRepository.create({
            debtAccountId: debtAccount.id,
            transactionId: transaction.id,
            source: DebtEventSourceEnum.INCOME_ATTACHMENT,
            ...fields
        });
        yield* transactionRepository.touchUpdatedAt(transaction.id);
        yield* this.assignDebtPaymentCategory(primaryEntry, debtAccount);
        yield* accountBalanceIncrementalService.updateBalancesByAccountIds([primaryEntry.accountId, debtAccount.id]);

        return debtAccount;
    });

    private readonly assignDebtPaymentCategory = Effect.fn('TransactionDebtSettlementService.assignDebtPaymentCategory')(function* (
        primaryEntry: TransactionEntryEntityInterface,
        debtAccount: Pick<AccountEntityInterface, 'id' | 'debtType'>
    ) {
        if (isDefined(primaryEntry.categoryId)) {
            return false;
        }

        const categoryId = debtAccount.debtType === AccountDebtTypeEnum.LENT ? LENDING_CATEGORY_ID : BORROWING_CATEGORY_ID;
        const category = yield* categoryRepository.findActiveById(categoryId);

        if (!isDefined(category)) {
            return false;
        }

        yield* transactionEntryRepository.updateById(primaryEntry.id, { categoryId, categorySource: CategorySourceEnum.DEBT_SETTLEMENT });

        return true;
    });

    private readonly buildSettlementEventFields = Effect.fnUntraced(function* (
        this: TransactionDebtSettlementService,
        transaction: Pick<TransactionWithEntriesEntityInterface, 'type' | 'operatedAt' | 'externalSource'>,
        debtAccount: AccountEntityInterface,
        primaryEntry: TransactionEntryEntityInterface
    ) {
        const entryInstrumentId = yield* this.getAccountInstrumentOrFail(primaryEntry.accountId);
        const isSameInstrument = entryInstrumentId === debtAccount.instrumentId;
        const amount = isSameInstrument
            ? primaryEntry.amount
            : yield* this.convertToDebtInstrumentAmount(primaryEntry, entryInstrumentId, debtAccount);
        const valuation = yield* entryBaseValuationService.valueMicroUnitEntry({
            accountId: debtAccount.id,
            amount,
            operatedAt: transaction.operatedAt,
            externalSource: transaction.externalSource
        });

        return {
            transactionEntryId: primaryEntry.id,
            direction: this.getDebtEventDirection(transaction, debtAccount),
            amount,
            baseInstrumentId: valuation.baseInstrumentId,
            baseExchangeRate: valuation.baseExchangeRate,
            baseAmount: valuation.baseAmount,
            operatedAt: transaction.operatedAt
        };
    });

    private readonly convertToDebtInstrumentAmount = Effect.fnUntraced(function* (
        primaryEntry: TransactionEntryEntityInterface,
        entryInstrumentId: number,
        debtAccount: AccountEntityInterface
    ) {
        const conversion = yield* exchangeRatesService.convertStrict(entryInstrumentId, debtAccount.instrumentId, primaryEntry.amount);

        if (!isDefined(conversion)) {
            return yield* Effect.die(new Error(t`Exchange rate not found`));
        }

        return conversion.amount;
    });

    private readonly revertDebtPaymentCategory = Effect.fnUntraced(function* (
        this: TransactionDebtSettlementService,
        transaction: TransactionWithEntriesEntityInterface
    ) {
        const [primaryEntry] = this.getPrimaryEntries(transaction);

        if (!isDefined(primaryEntry) || primaryEntry.categorySource !== CategorySourceEnum.DEBT_SETTLEMENT) {
            return;
        }

        yield* transactionEntryRepository.updateById(primaryEntry.id, { categoryId: null, categorySource: CategorySourceEnum.USER });
    });

    private readonly getTransactionOrFail = Effect.fnUntraced(function* (transactionId: number) {
        const transaction = yield* transactionRepository.getByIdWithEntries(transactionId);

        if (!isDefined(transaction)) {
            return yield* Effect.die(new Error(t`Transaction not found`));
        }

        return transaction;
    });

    private readonly getDebtAccountOrFail = Effect.fnUntraced(function* (accountId: number) {
        const account = yield* Db.query(db => accountRepository.findById(accountId, db));

        if (!isDefined(account) || account.type !== AccountTypeEnum.DEBT) {
            return yield* Effect.die(new Error(t`Debt account not found`));
        }

        return account;
    });

    private readonly getAccountInstrumentOrFail = Effect.fnUntraced(function* (accountId: number) {
        const account = yield* Db.query(db => accountRepository.findById(accountId, db));

        if (!isDefined(account)) {
            return yield* Effect.die(new Error(t`Account ${accountId} not found`));
        }

        return account.instrumentId;
    });

    private readonly assertNoSettlement = Effect.fnUntraced(function* (transaction: TransactionWithEntriesEntityInterface) {
        const debtEvent = yield* debtEventRepository.findByTransactionId(transaction.id);

        if (isDefined(debtEvent)) {
            yield* Effect.die(new Error(t`Transaction already has a debt attachment`));
        }
    });

    private getPrimaryEntryOrFail(transaction: TransactionWithEntriesEntityInterface) {
        const primaryEntries = this.getPrimaryEntries(transaction);
        const [primaryEntry] = primaryEntries;

        if (!isDefined(primaryEntry) || primaryEntries.length !== 1) {
            return Effect.die(new Error(t`Transaction must have exactly one primary entry`));
        }

        return Effect.succeed(primaryEntry);
    }

    private getPrimaryEntries(transaction: Pick<TransactionWithEntriesEntityInterface, 'entries'>): TransactionEntryEntityInterface[] {
        return getTransactionCategoryEntries(transaction.entries).filter(entry => entry.kind === TransactionEntryKindEnum.PRIMARY);
    }

    private assertTransactionSupportsDebtSettlement(transaction: TransactionWithEntriesEntityInterface) {
        if (transaction.type === TransactionTypeEnum.EXPENSE || transaction.type === TransactionTypeEnum.INCOME) {
            return Effect.void;
        }

        return Effect.die(new Error(t`Could not attach debt`));
    }

    private assertDebtAccountIsNotPrimaryAccount(primaryEntry: TransactionEntryEntityInterface, debtAccount: AccountEntityInterface) {
        if (primaryEntry.accountId === debtAccount.id) {
            return Effect.die(new Error(t`Debt account cannot match transaction account`));
        }

        return Effect.void;
    }

    private getDebtEventDirection(
        transaction: Pick<TransactionWithEntriesEntityInterface, 'type'>,
        debtAccount: Pick<AccountEntityInterface, 'debtType'>
    ): DebtEventDirectionEnum {
        const isExpense = transaction.type === TransactionTypeEnum.EXPENSE;

        if (debtAccount.debtType === AccountDebtTypeEnum.LENT) {
            return isExpense ? DebtEventDirectionEnum.OPEN : DebtEventDirectionEnum.CLOSE;
        }

        return isExpense ? DebtEventDirectionEnum.CLOSE : DebtEventDirectionEnum.OPEN;
    }
}

export const transactionDebtSettlementService = new TransactionDebtSettlementService();
