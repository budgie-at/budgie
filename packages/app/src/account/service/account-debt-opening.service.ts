import {
    AccountDebtTypeEnum,
    AccountNatureEnum,
    BORROWING_CATEGORY_ID,
    CategorySourceEnum,
    Db,
    DebtEventDirectionEnum,
    DebtEventSourceEnum,
    LENDING_CATEGORY_ID,
    TransactionEntryKindEnum,
    TransactionEntryTypeEnum,
    TransactionTypeEnum
} from '@budgie/contracts';
import { t } from '@lingui/core/macro';
import * as Effect from 'effect/Effect';

import { isDefined, isPositiveNumber } from '@rnw-community/shared';

import { accountRepository, debtEventRepository, transactionEntryRepository, transactionRepository } from '../../@generic/drizzle/db/db';
import { convertToMicroUnits } from '../../@generic/utils/convert-to-micro-units.util';
import { exchangeRatesService } from '../../exchange-rate/service/exchange-rates.service';
import { entryBaseValuationService } from '../../money-data/service/entry-base-valuation.service';
import { transactionDebtSettlementService } from '../../transaction/service/transaction-debt-settlement.service';
import { getTransactionCategoryEntries } from '../../transaction/utils/get-transaction-category-entries.util';
import { updateDebtTargetBaseValuation } from '../util/update-debt-target-base-valuation.util';

import { accountBalanceIncrementalService } from './account-balance-incremental.service';
import { accountService } from './account.service';

import type {
    AccountEntityInterface,
    DebtAccountCreateInputInterface,
    TransactionEntityInterface,
    TransactionWithEntriesEntityInterface
} from '@budgie/contracts';

class AccountDebtOpeningService {
    readonly openDebtWithFundingAccount = Effect.fn('AccountDebtOpeningService.openDebtWithFundingAccount')(
        function* (this: AccountDebtOpeningService, input: DebtAccountCreateInputInterface, fundingAccountId: number) {
            const fundingAccount = yield* this.getAccountOrFail(fundingAccountId);
            const targetAmount = yield* this.getPositiveOpeningAmount(input.targetBalance);
            const account = yield* this.createZeroTargetDebtAccount(input);
            const conversion = yield* exchangeRatesService.convert(account.instrumentId, fundingAccount.instrumentId, targetAmount);
            const transaction = yield* this.createFundingTransaction(input, fundingAccountId);
            const entry = yield* this.createFundingEntry(transaction, fundingAccountId, conversion.amount);
            const valuedAccount = yield* this.updateDebtTargetAmount(account, targetAmount, transaction.operatedAt);

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
            yield* accountService.syncManualDebtEvents(valuedAccount, convertToMicroUnits(input.currentBalance), transaction.operatedAt);
            yield* accountBalanceIncrementalService.updateBalancesByAccountIds([fundingAccountId, valuedAccount.id]);

            return valuedAccount;
        },
        effect => Db.transaction(effect)
    );

    readonly createBorrowedDebtFromIncome = Effect.fn('AccountDebtOpeningService.createBorrowedDebtFromIncome')(
        function* (this: AccountDebtOpeningService, input: DebtAccountCreateInputInterface, incomeTransactionId: number) {
            yield* this.assertBorrowedDebtType(input.debtType);

            const transaction = yield* this.getOpeningIncomeTransaction(incomeTransactionId);
            const primaryEntry = yield* this.getSingleOpeningIncomeEntry(transaction);
            const primaryAccount = yield* this.getAccountOrFail(primaryEntry.accountId);
            const account = yield* this.createZeroTargetDebtAccount({ ...input, instrumentId: primaryAccount.instrumentId });

            yield* transactionDebtSettlementService.attach({ transactionId: incomeTransactionId, debtAccountId: account.id });

            return yield* this.updateDebtTargetAmount(account, primaryEntry.amount, transaction.operatedAt);
        },
        effect => Db.transaction(effect)
    );

    private readonly createZeroTargetDebtAccount = Effect.fn('AccountDebtOpeningService.createZeroTargetDebtAccount')(function* (
        input: DebtAccountCreateInputInterface
    ) {
        const [{ count }] = yield* Db.query(() => accountRepository.count());

        const nature = input.debtType === AccountDebtTypeEnum.LENT ? AccountNatureEnum.ASSET : AccountNatureEnum.LIABILITY;

        return yield* accountRepository.create({ ...input, targetBalance: 0, order: count + 1, nature });
    });

    private readonly createFundingTransaction = Effect.fn('AccountDebtOpeningService.createFundingTransaction')(function* (
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

    private readonly createFundingEntry = Effect.fn('AccountDebtOpeningService.createFundingEntry')(function* (
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

    private readonly getOpeningIncomeTransaction = Effect.fn('AccountDebtOpeningService.getOpeningIncomeTransaction')(function* (
        id: number
    ) {
        const transaction = yield* transactionRepository.getByIdWithEntries(id);

        if (!isDefined(transaction)) {
            return yield* Effect.fail(new Error(t`Transaction not found`));
        }

        if (transaction.type !== TransactionTypeEnum.INCOME) {
            return yield* Effect.fail(new Error(t`Only income transactions can be converted`));
        }

        return transaction;
    });

    private readonly getAccountOrFail = Effect.fn('AccountDebtOpeningService.getAccountOrFail')(function* (id: number) {
        const account = yield* Db.query(db => accountRepository.findById(id, db));

        if (!isDefined(account)) {
            return yield* Effect.fail(new Error(t`Account ${id} not found`));
        }

        return account;
    });

    private readonly updateDebtTargetAmount = Effect.fn('AccountDebtOpeningService.updateDebtTargetAmount')(function* (
        account: AccountEntityInterface,
        targetBalance: number,
        operatedAt: Date
    ) {
        const updatedAccount = yield* accountRepository.updateById(account.id, { targetBalance });

        return yield* updateDebtTargetBaseValuation(updatedAccount, operatedAt);
    });

    private readonly getPositiveOpeningAmount = Effect.fn('AccountDebtOpeningService.getPositiveOpeningAmount')(function* (amount: number) {
        const openingAmount = convertToMicroUnits(amount);

        if (!isPositiveNumber(openingAmount)) {
            return yield* Effect.fail(new Error(t`Enter all amounts`));
        }

        return openingAmount;
    });

    private readonly getSingleOpeningIncomeEntry = Effect.fn('AccountDebtOpeningService.getSingleOpeningIncomeEntry')(function* (
        transaction: TransactionWithEntriesEntityInterface
    ) {
        const categoryEntries = getTransactionCategoryEntries(transaction.entries);
        const primaryEntry = categoryEntries.at(0);

        if (!isDefined(primaryEntry) || categoryEntries.length !== 1) {
            return yield* Effect.fail(new Error(t`Only single-entry incomes can be converted`));
        }

        return primaryEntry;
    });

    private readonly assertBorrowedDebtType = Effect.fn('AccountDebtOpeningService.assertBorrowedDebtType')(function* (
        debtType: AccountDebtTypeEnum
    ) {
        if (debtType !== AccountDebtTypeEnum.BORROW) {
            yield* Effect.fail(new Error(t`Borrowed debt account expected`));
        }
    });
}

export const accountDebtOpeningService = new AccountDebtOpeningService();
