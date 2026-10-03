import {
    AccountDebtTypeEnum,
    AccountRepository,
    AccountTypeEnum,
    BORROWING_CATEGORY_ID,
    CategoryRepository,
    CategorySourceEnum,
    Db,
    DebtEventDirectionEnum,
    DebtEventRepository,
    DebtEventSourceEnum,
    LENDING_CATEGORY_ID,
    TransactionEntryKindEnum,
    TransactionEntryRepository,
    TransactionRepository,
    TransactionTypeEnum
} from '@budgie/contracts';
import { EntryBaseValuationService, ExchangeRatesService } from '@budgie/market';
import { t } from '@lingui/core/macro';
import * as Context from 'effect/Context';
import * as Effect from 'effect/Effect';
import * as Layer from 'effect/Layer';

import { isDefined } from '@rnw-community/shared';

import { AccountBalanceIncrementalService } from '../../account/service/account-balance-incremental.service';
import { getTransactionCategoryEntries } from '../util/get-transaction-category-entries.util';

import type { AttachDebtSettlementParamsInterface } from '../interface/attach-debt-settlement-params.interface';
import type { AccountEntityInterface, TransactionEntryEntityInterface, TransactionWithEntriesEntityInterface } from '@budgie/contracts';

export class TransactionDebtSettlementService extends Context.Service<TransactionDebtSettlementService>()(
    '@budgie/ledger/TransactionDebtSettlementService',
    {
        make: Effect.gen(function* () {
            const accountRepository = yield* AccountRepository;
            const categoryRepository = yield* CategoryRepository;
            const debtEventRepository = yield* DebtEventRepository;
            const transactionEntryRepository = yield* TransactionEntryRepository;
            const transactionRepository = yield* TransactionRepository;
            const accountBalanceIncrementalService = yield* AccountBalanceIncrementalService;
            const exchangeRatesService = yield* ExchangeRatesService;
            const entryBaseValuationService = yield* EntryBaseValuationService;

            const getPrimaryEntries = (transaction: Pick<TransactionWithEntriesEntityInterface, 'entries'>) =>
                getTransactionCategoryEntries(transaction.entries).filter(entry => entry.kind === TransactionEntryKindEnum.PRIMARY);

            const getPrimaryEntryOrFail = (transaction: TransactionWithEntriesEntityInterface) => {
                const primaryEntries = getPrimaryEntries(transaction);
                const [primaryEntry] = primaryEntries;

                if (!isDefined(primaryEntry) || primaryEntries.length !== 1) {
                    return Effect.die(new Error(t`Transaction must have exactly one primary entry`));
                }

                return Effect.succeed(primaryEntry);
            };

            const assertTransactionSupportsDebtSettlement = (transaction: TransactionWithEntriesEntityInterface) => {
                if (transaction.type === TransactionTypeEnum.EXPENSE || transaction.type === TransactionTypeEnum.INCOME) {
                    return Effect.void;
                }

                return Effect.die(new Error(t`Could not attach debt`));
            };

            const assertDebtAccountIsNotPrimaryAccount = (
                primaryEntry: TransactionEntryEntityInterface,
                debtAccount: AccountEntityInterface
            ) => {
                if (primaryEntry.accountId === debtAccount.id) {
                    return Effect.die(new Error(t`Debt account cannot match transaction account`));
                }

                return Effect.void;
            };

            const getDebtEventDirection = (
                transaction: Pick<TransactionWithEntriesEntityInterface, 'type'>,
                debtAccount: Pick<AccountEntityInterface, 'debtType'>
            ): DebtEventDirectionEnum => {
                const isExpense = transaction.type === TransactionTypeEnum.EXPENSE;

                if (debtAccount.debtType === AccountDebtTypeEnum.LENT) {
                    return isExpense ? DebtEventDirectionEnum.OPEN : DebtEventDirectionEnum.CLOSE;
                }

                return isExpense ? DebtEventDirectionEnum.CLOSE : DebtEventDirectionEnum.OPEN;
            };

            const getTransactionOrFail = Effect.fnUntraced(function* (transactionId: number) {
                const transaction = yield* transactionRepository.getByIdWithEntries(transactionId);

                if (!isDefined(transaction)) {
                    return yield* Effect.die(new Error(t`Transaction not found`));
                }

                return transaction;
            });

            const getDebtAccountOrFail = Effect.fnUntraced(function* (accountId: number) {
                const account = yield* accountRepository.findById(accountId);

                if (!isDefined(account) || account.type !== AccountTypeEnum.DEBT) {
                    return yield* Effect.die(new Error(t`Debt account not found`));
                }

                return account;
            });

            const getAccountInstrumentOrFail = Effect.fnUntraced(function* (accountId: number) {
                const account = yield* accountRepository.findById(accountId);

                if (!isDefined(account)) {
                    return yield* Effect.die(new Error(t`Account ${accountId} not found`));
                }

                return account.instrumentId;
            });

            const assertNoSettlement = Effect.fnUntraced(function* (transaction: TransactionWithEntriesEntityInterface) {
                const debtEvent = yield* debtEventRepository.findByTransactionId(transaction.id);

                if (isDefined(debtEvent)) {
                    return yield* Effect.die(new Error(t`Transaction already has a debt attachment`));
                }
            });

            const convertToDebtInstrumentAmount = Effect.fnUntraced(function* (
                primaryEntry: TransactionEntryEntityInterface,
                entryInstrumentId: number,
                debtAccount: AccountEntityInterface
            ) {
                const conversion = yield* exchangeRatesService.convertStrict(
                    entryInstrumentId,
                    debtAccount.instrumentId,
                    primaryEntry.amount
                );

                if (!isDefined(conversion)) {
                    return yield* Effect.die(new Error(t`Exchange rate not found`));
                }

                return conversion.amount;
            });

            const buildSettlementEventFields = Effect.fnUntraced(function* (
                transaction: Pick<TransactionWithEntriesEntityInterface, 'type' | 'operatedAt' | 'externalSource'>,
                debtAccount: AccountEntityInterface,
                primaryEntry: TransactionEntryEntityInterface
            ) {
                const entryInstrumentId = yield* getAccountInstrumentOrFail(primaryEntry.accountId);
                const isSameInstrument = entryInstrumentId === debtAccount.instrumentId;
                const amount = isSameInstrument
                    ? primaryEntry.amount
                    : yield* convertToDebtInstrumentAmount(primaryEntry, entryInstrumentId, debtAccount);
                const valuation = yield* entryBaseValuationService.valueMicroUnitEntry({
                    accountId: debtAccount.id,
                    amount,
                    operatedAt: transaction.operatedAt
                });

                return {
                    transactionEntryId: primaryEntry.id,
                    direction: getDebtEventDirection(transaction, debtAccount),
                    amount,
                    baseInstrumentId: valuation.baseInstrumentId,
                    baseExchangeRate: valuation.baseExchangeRate,
                    baseAmount: valuation.baseAmount,
                    operatedAt: transaction.operatedAt
                };
            });

            const assignDebtPaymentCategory = Effect.fn('TransactionDebtSettlementService.assignDebtPaymentCategory')(function* (
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

                yield* transactionEntryRepository.updateById(primaryEntry.id, {
                    categoryId,
                    categorySource: CategorySourceEnum.DEBT_SETTLEMENT
                });

                return true;
            });

            const revertDebtPaymentCategory = Effect.fnUntraced(function* (transaction: TransactionWithEntriesEntityInterface) {
                const [primaryEntry] = getPrimaryEntries(transaction);

                if (!isDefined(primaryEntry) || primaryEntry.categorySource !== CategorySourceEnum.DEBT_SETTLEMENT) {
                    return;
                }

                yield* transactionEntryRepository.updateById(primaryEntry.id, {
                    categoryId: null,
                    categorySource: CategorySourceEnum.USER
                });
            });

            const attachInTransaction = Effect.fn('TransactionDebtSettlementService.attachInTransaction')(function* (
                params: AttachDebtSettlementParamsInterface
            ) {
                const transaction = yield* getTransactionOrFail(params.transactionId);
                const debtAccount = yield* getDebtAccountOrFail(params.debtAccountId);

                yield* assertTransactionSupportsDebtSettlement(transaction);
                yield* assertNoSettlement(transaction);
                const primaryEntry = yield* getPrimaryEntryOrFail(transaction);
                yield* assertDebtAccountIsNotPrimaryAccount(primaryEntry, debtAccount);

                const fields = yield* buildSettlementEventFields(transaction, debtAccount, primaryEntry);

                yield* debtEventRepository.create({
                    debtAccountId: debtAccount.id,
                    transactionId: transaction.id,
                    source: DebtEventSourceEnum.INCOME_ATTACHMENT,
                    ...fields
                });
                yield* transactionRepository.touchUpdatedAt(transaction.id);
                yield* assignDebtPaymentCategory(primaryEntry, debtAccount);
                yield* accountBalanceIncrementalService.updateBalancesByAccountIds([primaryEntry.accountId, debtAccount.id]);

                return debtAccount;
            });

            return {
                attach: Effect.fn('TransactionDebtSettlementService.attach')(
                    function* (params: AttachDebtSettlementParamsInterface) {
                        return yield* attachInTransaction(params);
                    },
                    effect => Db.transaction(effect)
                ),
                detach: Effect.fn('TransactionDebtSettlementService.detach')(
                    function* (transactionId: number) {
                        const transaction = yield* getTransactionOrFail(transactionId);
                        const debtEvent = yield* debtEventRepository.findByTransactionId(transactionId);

                        yield* debtEventRepository.deleteByTransactionId(transactionId);
                        yield* revertDebtPaymentCategory(transaction);
                        yield* transactionRepository.touchUpdatedAt(transactionId);
                        yield* accountBalanceIncrementalService.updateBalancesByAccountIds(
                            [
                                transaction.toAccountId,
                                transaction.fromAccountId,
                                isDefined(debtEvent) ? debtEvent.debtAccountId : null
                            ].filter(isDefined)
                        );
                    },
                    effect => Db.transaction(effect)
                ),
                resyncInTransaction: Effect.fn('TransactionDebtSettlementService.resyncInTransaction')(function* (transactionId: number) {
                    const debtEvent = yield* debtEventRepository.findByTransactionId(transactionId);

                    if (!isDefined(debtEvent) || debtEvent.source !== DebtEventSourceEnum.INCOME_ATTACHMENT) {
                        return;
                    }

                    const transaction = yield* getTransactionOrFail(transactionId);
                    const debtAccount = yield* getDebtAccountOrFail(debtEvent.debtAccountId);

                    yield* assertTransactionSupportsDebtSettlement(transaction);
                    const primaryEntry = yield* getPrimaryEntryOrFail(transaction);
                    yield* assertDebtAccountIsNotPrimaryAccount(primaryEntry, debtAccount);

                    const fields = yield* buildSettlementEventFields(transaction, debtAccount, primaryEntry);

                    yield* debtEventRepository.updateById(debtEvent.id, fields);
                    yield* accountBalanceIncrementalService.updateBalancesByAccountIds([primaryEntry.accountId, debtAccount.id]);
                })
            };
        })
    }
) {
    static readonly layer = Layer.effect(TransactionDebtSettlementService, TransactionDebtSettlementService.make).pipe(
        Layer.provide([
            AccountRepository.layer,
            CategoryRepository.layer,
            DebtEventRepository.layer,
            TransactionEntryRepository.layer,
            TransactionRepository.layer,
            AccountBalanceIncrementalService.layer,
            ExchangeRatesService.layer,
            EntryBaseValuationService.layer
        ])
    );
}
