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

import type { RuleTransferAccountIdsInterface } from '../interface/rule-transfer-account-ids.interface';
import type { RuleTransferAccountsInterface } from '../interface/rule-transfer-accounts.interface';
import type { RuleTransferCandidateInterface } from '../interface/rule-transfer-candidate.interface';
import type { RuleTransferConversionBuildInputInterface } from '../interface/rule-transfer-conversion-build-input.interface';
import type { RuleTransferConversionInterface } from '../interface/rule-transfer-conversion.interface';
import type { RuleTransferConvertedAmountInterface } from '../interface/rule-transfer-converted-amount.interface';
import type { RuleTransferEntriesInputInterface } from '../interface/rule-transfer-entries-input.interface';
import type { TransactionEntryCreateEntityInterface } from '@budgie/contracts';

export class RuleTransferConversionService extends Context.Service<RuleTransferConversionService>()(
    '@budgie/app/RuleTransferConversionService',
    {
        make: Effect.gen(function* () {
            const accountRepository = yield* AccountRepository;
            const transactionEntryRepository = yield* TransactionEntryRepository;
            const transactionRepository = yield* TransactionRepository;
            const exchangeRatesService = yield* ExchangeRatesService;
            const entryBaseValuationService = yield* EntryBaseValuationService;

            const isRuleTransferConvertibleType = (transactionType: TransactionTypeEnum): boolean =>
                transactionType === TransactionTypeEnum.EXPENSE || transactionType === TransactionTypeEnum.INCOME;

            const resolveRuleTransferAccountIds = (
                transactionType: TransactionTypeEnum,
                originalAccountId: number,
                targetAccountId: number
            ): RuleTransferAccountIdsInterface | null => {
                if (originalAccountId === targetAccountId) {
                    return null;
                }

                const isExpense = transactionType === TransactionTypeEnum.EXPENSE;

                return {
                    fromAccountId: isExpense ? originalAccountId : targetAccountId,
                    toAccountId: isExpense ? targetAccountId : originalAccountId
                };
            };

            const findRuleTransferCandidate = Effect.fn('RuleTransferConversionService.findRuleTransferCandidate')(function* (
                transactionId: number,
                targetAccountId: number
            ) {
                const transaction = yield* transactionRepository.getByIdWithEntries(transactionId);
                if (!isDefined(transaction) || !isRuleTransferConvertibleType(transaction.type)) {
                    return null;
                }

                const [originalEntry] = transaction.entries;
                if (!isDefined(originalEntry)) {
                    return null;
                }

                const accountIds = resolveRuleTransferAccountIds(transaction.type, originalEntry.accountId, targetAccountId);
                if (!isDefined(accountIds)) {
                    return null;
                }

                const candidate: RuleTransferCandidateInterface = { transaction, originalEntry, accountIds };

                return candidate;
            });

            const convertRuleTransferAmount = Effect.fn('RuleTransferConversionService.convertRuleTransferAmount')(function* (
                accounts: RuleTransferAccountsInterface,
                amount: number
            ) {
                const converted = yield* exchangeRatesService.convert(
                    accounts.fromAccount.instrumentId,
                    accounts.toAccount.instrumentId,
                    amount
                );
                const convertedAmount: RuleTransferConvertedAmountInterface = {
                    convertedAmount: converted.amount,
                    exchangeRate: converted.exchangeRate
                };

                return convertedAmount;
            });

            const findRuleTransferAccounts = Effect.fn('RuleTransferConversionService.findRuleTransferAccounts')(function* (
                accountIds: RuleTransferAccountIdsInterface
            ) {
                const [fromAccount, toAccount] = yield* Effect.all(
                    [accountRepository.findById(accountIds.fromAccountId), accountRepository.findById(accountIds.toAccountId)],
                    { concurrency: 'unbounded' }
                );

                if (!isDefined(fromAccount) || !isDefined(toAccount)) {
                    return null;
                }

                if (fromAccount.type === AccountTypeEnum.DEBT || toAccount.type === AccountTypeEnum.DEBT) {
                    return null;
                }

                const accounts: RuleTransferAccountsInterface = { fromAccount, toAccount };

                return accounts;
            });

            const buildRuleTransferConversionResult = ({
                transaction,
                originalEntry,
                accountIds,
                converted
            }: RuleTransferConversionBuildInputInterface): RuleTransferConversionInterface => ({
                transaction,
                originalEntry,
                fromAccountId: accountIds.fromAccountId,
                toAccountId: accountIds.toAccountId,
                convertedAmount: converted.convertedAmount,
                exchangeRate: converted.exchangeRate,
                transactionType: TransactionTypeEnum.TRANSFER
            });

            const buildRuleTransferConversion = Effect.fn('RuleTransferConversionService.buildRuleTransferConversion')(function* (
                transactionId: number,
                targetAccountId: number
            ) {
                const candidate = yield* findRuleTransferCandidate(transactionId, targetAccountId);
                if (!isDefined(candidate)) {
                    return null;
                }

                const accounts = yield* findRuleTransferAccounts(candidate.accountIds);
                if (!isDefined(accounts)) {
                    return null;
                }

                const converted = yield* convertRuleTransferAmount(accounts, candidate.originalEntry.amount);

                return buildRuleTransferConversionResult({ ...candidate, converted });
            });

            const buildRuleTransferEntries = ({
                transactionId,
                originalEntry,
                fromAccountId,
                toAccountId,
                convertedAmount,
                creditValuation,
                debitValuation
            }: RuleTransferEntriesInputInterface): TransactionEntryCreateEntityInterface[] => [
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
                    baseInstrumentId: creditValuation.baseInstrumentId,
                    baseExchangeRate: creditValuation.baseExchangeRate,
                    baseAmount: creditValuation.baseAmount
                },
                {
                    transactionId,
                    accountId: toAccountId,
                    type: TransactionEntryTypeEnum.DEBIT,
                    kind: TransactionEntryKindEnum.PRIMARY,
                    amount: convertedAmount,
                    categoryId: null,
                    categorySource: CategorySourceEnum.USER,
                    mccCategoryId: null,
                    externalId: null,
                    baseInstrumentId: debitValuation.baseInstrumentId,
                    baseExchangeRate: debitValuation.baseExchangeRate,
                    baseAmount: debitValuation.baseAmount
                }
            ];

            const convertTransactionToTransfer = Effect.fn('RuleTransferConversionService.convertTransactionToTransfer')(function* (
                transactionId: number,
                targetAccountId: number
            ) {
                const conversion = yield* buildRuleTransferConversion(transactionId, targetAccountId);

                if (!isDefined(conversion)) {
                    return false;
                }

                const [creditValuation, debitValuation] = yield* Effect.all(
                    [
                        entryBaseValuationService.valueMicroUnitEntry({
                            accountId: conversion.fromAccountId,
                            amount: conversion.originalEntry.amount,
                            operatedAt: conversion.transaction.operatedAt,
                            externalSource: null
                        }),
                        entryBaseValuationService.valueMicroUnitEntry({
                            accountId: conversion.toAccountId,
                            amount: conversion.convertedAmount,
                            operatedAt: conversion.transaction.operatedAt,
                            externalSource: null
                        })
                    ],
                    { concurrency: 'unbounded' }
                );

                yield* transactionRepository.updateById(transactionId, {
                    type: conversion.transactionType,
                    fromAccountId: conversion.fromAccountId,
                    toAccountId: conversion.toAccountId,
                    exchangeRate: conversion.exchangeRate
                });

                yield* transactionEntryRepository.deleteByTransactionId(transactionId);

                yield* transactionEntryRepository.bulkCreate(
                    buildRuleTransferEntries({
                        transactionId,
                        originalEntry: conversion.originalEntry,
                        fromAccountId: conversion.fromAccountId,
                        toAccountId: conversion.toAccountId,
                        convertedAmount: conversion.convertedAmount,
                        creditValuation,
                        debitValuation
                    })
                );

                return true;
            });

            return { convertTransactionToTransfer };
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
