import {
    AccountRepository,
    AccountTypeEnum,
    CategorySourceEnum,
    TransactionEntryKindEnum,
    TransactionEntryRepository,
    TransactionEntryTypeEnum,
    TransactionRepository,
    TransactionTypeEnum
} from '@budgie/contracts';
import { EntryBaseValuationService, ExchangeRatesService } from '@budgie/market';
import * as Context from 'effect/Context';
import * as Effect from 'effect/Effect';
import * as Layer from 'effect/Layer';

import { isDefined } from '@rnw-community/shared';

export class RuleTransferConversionService extends Context.Service<RuleTransferConversionService>()(
    '@budgie/rules/RuleTransferConversionService',
    {
        make: Effect.gen(function* () {
            const accountRepository = yield* AccountRepository;
            const transactionEntryRepository = yield* TransactionEntryRepository;
            const transactionRepository = yield* TransactionRepository;
            const exchangeRatesService = yield* ExchangeRatesService;
            const entryBaseValuationService = yield* EntryBaseValuationService;

            return {
                convertTransactionToTransfer: Effect.fn('RuleTransferConversionService.convertTransactionToTransfer')(function* (
                    transactionId: number,
                    targetAccountId: number
                ) {
                    const transaction = yield* transactionRepository.getByIdWithEntries(transactionId);
                    const isConvertible =
                        (transaction?.type === TransactionTypeEnum.EXPENSE || transaction?.type === TransactionTypeEnum.INCOME) &&
                        !isDefined(transaction.consolidationType);
                    const [originalEntry] = transaction?.entries ?? [];

                    if (!isConvertible || !isDefined(originalEntry) || originalEntry.accountId === targetAccountId) {
                        return false;
                    }

                    const isExpense = transaction.type === TransactionTypeEnum.EXPENSE;
                    const fromAccountId = isExpense ? originalEntry.accountId : targetAccountId;
                    const toAccountId = isExpense ? targetAccountId : originalEntry.accountId;
                    const [fromAccount, toAccount] = yield* Effect.all(
                        [accountRepository.findById(fromAccountId), accountRepository.findById(toAccountId)],
                        { concurrency: 'unbounded' }
                    );

                    if (
                        !isDefined(fromAccount) ||
                        !isDefined(toAccount) ||
                        fromAccount.type === AccountTypeEnum.DEBT ||
                        toAccount.type === AccountTypeEnum.DEBT
                    ) {
                        return false;
                    }

                    const converted = yield* exchangeRatesService.convert(
                        fromAccount.instrumentId,
                        toAccount.instrumentId,
                        originalEntry.amount
                    );
                    const [creditValuation, debitValuation] = yield* Effect.all(
                        [
                            entryBaseValuationService.valueMicroUnitEntry({
                                accountId: fromAccountId,
                                amount: originalEntry.amount,
                                operatedAt: transaction.operatedAt
                            }),
                            entryBaseValuationService.valueMicroUnitEntry({
                                accountId: toAccountId,
                                amount: converted.amount,
                                operatedAt: transaction.operatedAt
                            })
                        ],
                        { concurrency: 'unbounded' }
                    );

                    yield* transactionRepository.updateById(transactionId, {
                        type: TransactionTypeEnum.TRANSFER,
                        fromAccountId,
                        toAccountId,
                        exchangeRate: converted.exchangeRate
                    });
                    yield* transactionEntryRepository.deleteByTransactionId(transactionId);
                    yield* transactionEntryRepository.bulkCreate([
                        {
                            transactionId,
                            accountId: fromAccountId,
                            type: TransactionEntryTypeEnum.CREDIT,
                            kind: TransactionEntryKindEnum.PRIMARY,
                            amount: originalEntry.amount,
                            categoryId: null,
                            categorySource: CategorySourceEnum.USER,
                            mccCategoryId: originalEntry.mccCategoryId,
                            externalId: null,
                            ...creditValuation
                        },
                        {
                            transactionId,
                            accountId: toAccountId,
                            type: TransactionEntryTypeEnum.DEBIT,
                            kind: TransactionEntryKindEnum.PRIMARY,
                            amount: converted.amount,
                            categoryId: null,
                            categorySource: CategorySourceEnum.USER,
                            mccCategoryId: null,
                            externalId: null,
                            ...debitValuation
                        }
                    ]);

                    return true;
                })
            };
        })
    }
) {
    static readonly layer = Layer.effect(RuleTransferConversionService, RuleTransferConversionService.make).pipe(
        Layer.provide([
            AccountRepository.layer,
            TransactionEntryRepository.layer,
            TransactionRepository.layer,
            ExchangeRatesService.layer,
            EntryBaseValuationService.layer
        ])
    );
}
