import {
    AccountDebtTypeEnum,
    AccountNatureEnum,
    AccountRepository,
    BORROWING_CATEGORY_ID,
    CategorySourceEnum,
    Db,
    DebtEventDirectionEnum,
    DebtEventRepository,
    DebtEventSourceEnum,
    LENDING_CATEGORY_ID,
    TransactionEntryKindEnum,
    TransactionEntryRepository,
    TransactionEntryTypeEnum,
    TransactionRepository,
    TransactionTypeEnum
} from '@budgie/contracts';
import { t } from '@lingui/core/macro';
import * as Context from 'effect/Context';
import * as Effect from 'effect/Effect';
import * as Layer from 'effect/Layer';

import { isDefined, isPositiveNumber } from '@rnw-community/shared';

import { convertToMicroUnits } from '../../@generic/utils/convert-to-micro-units.util';
import { ExchangeRatesService } from '../../exchange-rate/service/exchange-rates.service';
import { EntryBaseValuationService } from '../../money-data/service/entry-base-valuation.service';
import { TransactionDebtSettlementService } from '../../transaction/service/transaction-debt-settlement.service';
import { getTransactionCategoryEntries } from '../../transaction/utils/get-transaction-category-entries.util';

import { AccountBalanceIncrementalService } from './account-balance-incremental.service';
import { DebtAccountService } from './debt-account.service';

import type {
    AccountEntityInterface,
    DebtAccountCreateInputInterface,
    TransactionEntityInterface,
    TransactionWithEntriesEntityInterface
} from '@budgie/contracts';

export class AccountDebtOpeningService extends Context.Service<AccountDebtOpeningService>()('@budgie/app/AccountDebtOpeningService', {
    make: Effect.gen(function* () {
        const accountRepository = yield* AccountRepository;
        const debtEventRepository = yield* DebtEventRepository;
        const transactionEntryRepository = yield* TransactionEntryRepository;
        const transactionRepository = yield* TransactionRepository;
        const accountBalanceIncrementalService = yield* AccountBalanceIncrementalService;
        const debtAccountService = yield* DebtAccountService;
        const entryBaseValuationService = yield* EntryBaseValuationService;
        const exchangeRatesService = yield* ExchangeRatesService;
        const transactionDebtSettlementService = yield* TransactionDebtSettlementService;

        const createZeroTargetDebtAccount = Effect.fn('AccountDebtOpeningService.createZeroTargetDebtAccount')(function* (
            input: DebtAccountCreateInputInterface
        ) {
            const [{ count }] = yield* accountRepository.count();

            const nature = input.debtType === AccountDebtTypeEnum.LENT ? AccountNatureEnum.ASSET : AccountNatureEnum.LIABILITY;

            return yield* accountRepository.create({ ...input, targetBalance: 0, order: count + 1, nature });
        });

        const createFundingTransaction = Effect.fn('AccountDebtOpeningService.createFundingTransaction')(function* (
            input: DebtAccountCreateInputInterface,
            fundingAccountId: number
        ) {
            const isLentDebt = input.debtType === AccountDebtTypeEnum.LENT;

            return yield* transactionRepository.create({
                type: isLentDebt ? TransactionTypeEnum.EXPENSE : TransactionTypeEnum.INCOME,
                title: input.title,
                comment: '',
                externalId: null,
                externalSource: null,
                operatedAt: new Date(),
                exchangeRate: 1,
                fromAccountId: isLentDebt ? fundingAccountId : null,
                toAccountId: isLentDebt ? null : fundingAccountId,
                updatedBy: null
            });
        });

        const createFundingEntry = Effect.fn('AccountDebtOpeningService.createFundingEntry')(function* (
            transaction: TransactionEntityInterface,
            fundingAccountId: number,
            amount: number
        ) {
            const isExpense = transaction.type === TransactionTypeEnum.EXPENSE;
            const valuation = yield* entryBaseValuationService.valueMicroUnitEntry({
                accountId: fundingAccountId,
                amount,
                operatedAt: transaction.operatedAt,
                externalSource: null
            });

            return yield* transactionEntryRepository.create({
                transactionId: transaction.id,
                accountId: fundingAccountId,
                categoryId: isExpense ? LENDING_CATEGORY_ID : BORROWING_CATEGORY_ID,
                categorySource: CategorySourceEnum.DEBT_SETTLEMENT,
                mccCategoryId: null,
                type: isExpense ? TransactionEntryTypeEnum.CREDIT : TransactionEntryTypeEnum.DEBIT,
                kind: TransactionEntryKindEnum.PRIMARY,
                amount,
                externalId: null,
                exchangeRate: 1,
                baseInstrumentId: valuation.baseInstrumentId,
                baseExchangeRate: valuation.baseExchangeRate,
                baseAmount: valuation.baseAmount,
                toIban: null,
                originalTransactionId: null
            });
        });

        const getOpeningIncomeTransaction = Effect.fn('AccountDebtOpeningService.getOpeningIncomeTransaction')(function* (id: number) {
            const transaction = yield* transactionRepository.getByIdWithEntries(id);

            if (!isDefined(transaction)) {
                return yield* Effect.die(new Error(t`Transaction not found`));
            }

            if (transaction.type !== TransactionTypeEnum.INCOME) {
                return yield* Effect.die(new Error(t`Only income transactions can be converted`));
            }

            return transaction;
        });

        const getAccountOrFail = Effect.fn('AccountDebtOpeningService.getAccountOrFail')(function* (id: number) {
            const account = yield* accountRepository.findById(id);

            if (!isDefined(account)) {
                return yield* Effect.die(new Error(t`Account ${id} not found`));
            }

            return account;
        });

        const updateDebtTargetAmount = Effect.fn('AccountDebtOpeningService.updateDebtTargetAmount')(function* (
            account: AccountEntityInterface,
            targetBalance: number,
            operatedAt: Date
        ) {
            const updatedAccount = yield* accountRepository.updateById(account.id, { targetBalance });

            return yield* debtAccountService.updateDebtTargetBaseValuation(updatedAccount, operatedAt);
        });

        const getPositiveOpeningAmount = Effect.fn('AccountDebtOpeningService.getPositiveOpeningAmount')(function* (amount: number) {
            const openingAmount = convertToMicroUnits(amount);

            if (!isPositiveNumber(openingAmount)) {
                return yield* Effect.die(new Error(t`Enter all amounts`));
            }

            return openingAmount;
        });

        const getSingleOpeningIncomeEntry = Effect.fn('AccountDebtOpeningService.getSingleOpeningIncomeEntry')(function* (
            transaction: TransactionWithEntriesEntityInterface
        ) {
            const categoryEntries = getTransactionCategoryEntries(transaction.entries);
            const primaryEntry = categoryEntries.at(0);

            if (!isDefined(primaryEntry) || categoryEntries.length !== 1) {
                return yield* Effect.die(new Error(t`Only single-entry incomes can be converted`));
            }

            return primaryEntry;
        });

        const assertBorrowedDebtType = Effect.fn('AccountDebtOpeningService.assertBorrowedDebtType')(function* (
            debtType: AccountDebtTypeEnum
        ) {
            if (debtType !== AccountDebtTypeEnum.BORROW) {
                return yield* Effect.die(new Error(t`Borrowed debt account expected`));
            }
        });

        return {
            openDebtWithFundingAccount: Effect.fn('AccountDebtOpeningService.openDebtWithFundingAccount')(
                function* (input: DebtAccountCreateInputInterface, fundingAccountId: number) {
                    const fundingAccount = yield* getAccountOrFail(fundingAccountId);
                    const targetAmount = yield* getPositiveOpeningAmount(input.targetBalance);
                    const account = yield* createZeroTargetDebtAccount(input);
                    const conversion = yield* exchangeRatesService.convert(account.instrumentId, fundingAccount.instrumentId, targetAmount);
                    const transaction = yield* createFundingTransaction(input, fundingAccountId);
                    const entry = yield* createFundingEntry(transaction, fundingAccountId, conversion.amount);
                    const valuedAccount = yield* updateDebtTargetAmount(account, targetAmount, transaction.operatedAt);

                    yield* debtEventRepository.create({
                        debtAccountId: valuedAccount.id,
                        transactionId: transaction.id,
                        transactionEntryId: entry.id,
                        direction: DebtEventDirectionEnum.OPEN,
                        source: DebtEventSourceEnum.OPENING,
                        amount: valuedAccount.targetBalance,
                        baseInstrumentId: valuedAccount.targetBaseInstrumentId,
                        baseExchangeRate: valuedAccount.targetBaseExchangeRate,
                        baseAmount: valuedAccount.targetBaseAmount,
                        operatedAt: transaction.operatedAt
                    });
                    yield* debtAccountService.syncManualDebtEvents(
                        valuedAccount,
                        convertToMicroUnits(input.currentBalance),
                        transaction.operatedAt
                    );
                    yield* accountBalanceIncrementalService.updateBalancesByAccountIds([fundingAccountId, valuedAccount.id]);

                    return valuedAccount;
                },
                effect => Db.transaction(effect)
            ),
            createBorrowedDebtFromIncome: Effect.fn('AccountDebtOpeningService.createBorrowedDebtFromIncome')(
                function* (input: DebtAccountCreateInputInterface, incomeTransactionId: number) {
                    yield* assertBorrowedDebtType(input.debtType);

                    const transaction = yield* getOpeningIncomeTransaction(incomeTransactionId);
                    const primaryEntry = yield* getSingleOpeningIncomeEntry(transaction);
                    const primaryAccount = yield* getAccountOrFail(primaryEntry.accountId);
                    const account = yield* createZeroTargetDebtAccount({ ...input, instrumentId: primaryAccount.instrumentId });

                    yield* transactionDebtSettlementService.attach({ transactionId: incomeTransactionId, debtAccountId: account.id });

                    return yield* updateDebtTargetAmount(account, primaryEntry.amount, transaction.operatedAt);
                },
                effect => Db.transaction(effect)
            )
        };
    })
}) {
    static readonly layer = Layer.effect(AccountDebtOpeningService, AccountDebtOpeningService.make).pipe(
        Layer.provide([
            AccountRepository.layer,
            DebtEventRepository.layer,
            TransactionEntryRepository.layer,
            TransactionRepository.layer,
            AccountBalanceIncrementalService.layer,
            DebtAccountService.layer,
            EntryBaseValuationService.layer,
            ExchangeRatesService.layer,
            TransactionDebtSettlementService.layer
        ])
    );
}
