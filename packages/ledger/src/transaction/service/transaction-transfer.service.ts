import {
    AccountRepository,
    AccountTypeEnum,
    CategorySourceEnum,
    Db,
    DebtEventRepository,
    TransactionEntryCreateEntityInterface,
    TransactionEntryKindEnum,
    TransactionEntryRepository,
    TransactionEntryTypeEnum,
    TransactionRepository,
    TransactionTypeEnum,
    convertToMicroUnits
} from '@budgie/contracts';
import { EntryBaseValuationService, ExchangeRatesService } from '@budgie/market';
import { i18n } from '@lingui/core';
import { t } from '@lingui/core/macro';
import * as Context from 'effect/Context';
import * as Effect from 'effect/Effect';
import * as Layer from 'effect/Layer';

import { isDefined, isNotEmptyArray, isPositiveNumber } from '@rnw-community/shared';

import { DepositReceivingAmountMismatchError } from '../../account/error/deposit-receiving-amount-mismatch.error';
import { AccountBalanceIncrementalService } from '../../account/service/account-balance-incremental.service';
import { AccountService } from '../../account/service/account.service';
import { TRANSFER_CONVERSION_ERROR_MESSAGE } from '../constant/transfer-conversion-error-message.constant';
import { BuildTransferEntryCreateEntityInputInterface } from '../interface/build-transfer-entry-create-entity-input.interface';
import { TransferConversionResultInterface } from '../interface/transfer-conversion-result.interface';
import { assertTransferAccountsAreNotDebt } from '../utils/assert-transfer-accounts-are-not-debt.util';
import { getTransactionCategoryEntries } from '../utils/get-transaction-category-entries.util';
import { getTransactionFeeEntries } from '../utils/get-transaction-fee-entries.util';
import { transactionMapEntryInputToCreateEntity } from '../utils/transaction-map-entry-input-to-create-entity.util';

import type { ConvertToTransferParamsInterface } from '../interface/convert-to-transfer-params.interface';
import type { StartDepositInputInterface } from '../interface/start-deposit-input.interface';
import type { TransferConversionComputeInputInterface } from '../interface/transfer-conversion-compute-input.interface';
import type { TransactionEntryEntityInterface } from '@budgie/contracts';
import type { EntryBaseValuationInterface } from '@budgie/market';

export class TransactionTransferService extends Context.Service<TransactionTransferService>()('@budgie/ledger/TransactionTransferService', {
    make: Effect.gen(function* () {
        const accountRepository = yield* AccountRepository;
        const debtEventRepository = yield* DebtEventRepository;
        const transactionEntryRepository = yield* TransactionEntryRepository;
        const transactionRepository = yield* TransactionRepository;
        const accountBalanceIncrementalService = yield* AccountBalanceIncrementalService;
        const accountService = yield* AccountService;
        const exchangeRatesService = yield* ExchangeRatesService;
        const entryBaseValuationService = yield* EntryBaseValuationService;

        const buildFeeEntryCreateEntity = (
            transactionId: number,
            entry: TransactionEntryEntityInterface,
            valuation: EntryBaseValuationInterface
        ): TransactionEntryCreateEntityInterface => ({
            transactionId,
            accountId: entry.accountId,
            type: TransactionEntryTypeEnum.FEE,
            kind: TransactionEntryKindEnum.PRIMARY,
            amount: entry.amount,
            categoryId: entry.categoryId,
            categorySource: entry.categorySource,
            mccCategoryId: entry.mccCategoryId,
            externalId: entry.externalId,
            exchangeRate: entry.exchangeRate,
            baseInstrumentId: valuation.baseInstrumentId,
            baseExchangeRate: valuation.baseExchangeRate,
            baseAmount: valuation.baseAmount,
            toIban: entry.toIban
        });

        const buildTransferEntryCreateEntity = ({
            transactionId,
            accountId,
            type,
            amount,
            valuation
        }: BuildTransferEntryCreateEntityInputInterface): TransactionEntryCreateEntityInterface => ({
            transactionId,
            accountId,
            type,
            kind: TransactionEntryKindEnum.PRIMARY,
            amount,
            categoryId: null,
            categorySource: CategorySourceEnum.USER,
            mccCategoryId: null,
            externalId: null,
            exchangeRate: 1,
            baseInstrumentId: valuation.baseInstrumentId,
            baseExchangeRate: valuation.baseExchangeRate,
            baseAmount: valuation.baseAmount,
            toIban: null
        });

        const requireTransferAccountId = (accountId: number | null, kind: 'source' | 'destination') => {
            if (isDefined(accountId)) {
                return Effect.succeed(accountId);
            }

            return Effect.die(
                new Error(kind === 'source' ? t`Transaction must have a source account` : t`Transaction must have a destination account`)
            );
        };

        const getTransferConversionTransaction = Effect.fnUntraced(function* (
            id: number,
            direction: 'expense' | 'income',
            consolidatedErrorMessage: string
        ) {
            const transaction = yield* transactionRepository.getByIdWithEntries(id);

            if (!isDefined(transaction)) {
                return yield* Effect.die(new Error(t`Transaction not found`));
            }

            if (isDefined(transaction.consolidationType) || isDefined(transaction.consolidationParentTransactionId)) {
                return yield* Effect.die(new Error(consolidatedErrorMessage));
            }

            const errorMessage = TRANSFER_CONVERSION_ERROR_MESSAGE[direction];
            const expectedType = direction === 'expense' ? TransactionTypeEnum.EXPENSE : TransactionTypeEnum.INCOME;

            if (transaction.type !== expectedType) {
                return yield* Effect.die(new Error(i18n._(errorMessage.wrongType)));
            }

            if (getTransactionCategoryEntries(transaction.entries).length !== 1) {
                return yield* Effect.die(new Error(i18n._(errorMessage.multiEntry)));
            }

            return transaction;
        });

        const computeTransferConversion = Effect.fnUntraced(function* ({
            direction,
            params,
            transaction,
            fromAccount,
            toAccount,
            counterAmount
        }: TransferConversionComputeInputInterface) {
            const [transactionEntry] = getTransactionCategoryEntries(transaction.entries);
            const hasCustomRate = isPositiveNumber(params.customExchangeRate) && params.customExchangeRate !== 1;
            const isExpense = direction === 'expense';
            const conversion = isPositiveNumber(counterAmount)
                ? { exchangeRate: transactionEntry.amount / counterAmount, amount: counterAmount }
                : yield* exchangeRatesService.convert(
                      isExpense ? fromAccount.instrumentId : toAccount.instrumentId,
                      isExpense ? toAccount.instrumentId : fromAccount.instrumentId,
                      transactionEntry.amount
                  );
            const exchangeRate =
                hasCustomRate && isDefined(params.customExchangeRate) ? params.customExchangeRate : conversion.exchangeRate;
            const convertedAmount =
                hasCustomRate && isDefined(params.customExchangeRate)
                    ? Math.round(transactionEntry.amount / params.customExchangeRate)
                    : conversion.amount;

            return {
                creditAccountId: fromAccount.id,
                creditAmount: isExpense ? transactionEntry.amount : convertedAmount,
                debitAccountId: toAccount.id,
                debitAmount: isExpense ? convertedAmount : transactionEntry.amount,
                exchangeRate,
                fromAccountId: fromAccount.id,
                operatedAt: transaction.operatedAt,
                toAccountId: toAccount.id,
                transactionType: TransactionTypeEnum.TRANSFER,
                feeEntries: getTransactionFeeEntries(transaction.entries),
                operation: {
                    operationInstrumentId: transactionEntry.operationInstrumentId,
                    operationAmount: transactionEntry.operationAmount
                }
            } satisfies TransferConversionResultInterface;
        });

        const buildTransferConversion = Effect.fnUntraced(function* (
            direction: 'expense' | 'income',
            params: ConvertToTransferParamsInterface,
            counterAmount: number | null
        ) {
            const transaction = yield* getTransferConversionTransaction(
                params.id,
                direction,
                t`Consolidated transactions cannot be converted to transfers`
            );
            const isExpense = direction === 'expense';
            const fromAccountId = isExpense ? yield* requireTransferAccountId(transaction.fromAccountId, 'source') : params.accountId;
            const toAccountId = isExpense ? params.accountId : yield* requireTransferAccountId(transaction.toAccountId, 'destination');
            const [fromAccount, toAccount] = yield* Effect.all(
                [
                    accountService.findByIdIncludingArchivedOrFail(fromAccountId),
                    accountService.findByIdIncludingArchivedOrFail(toAccountId)
                ],
                { concurrency: 'unbounded' }
            );

            yield* assertTransferAccountsAreNotDebt([fromAccount, toAccount]);

            return yield* computeTransferConversion({ direction, params, transaction, fromAccount, toAccount, counterAmount });
        });

        const buildConversionFeeEntries = Effect.fnUntraced(function* (
            params: ConvertToTransferParamsInterface,
            conversion: TransferConversionResultInterface
        ) {
            if (isNotEmptyArray(params.feeEntries)) {
                const feeEntries = params.feeEntries.map(entry => ({ ...entry, accountId: conversion.creditAccountId }));
                const feeValuations = yield* entryBaseValuationService.valueEntries(feeEntries, conversion.operatedAt);

                return feeEntries.map(entry => transactionMapEntryInputToCreateEntity(entry, params.id, feeValuations.get(entry)));
            }

            return yield* Effect.forEach(
                conversion.feeEntries,
                entry =>
                    entryBaseValuationService
                        .valueMicroUnitEntry({
                            accountId: entry.accountId,
                            amount: entry.amount,
                            operatedAt: conversion.operatedAt
                        })
                        .pipe(Effect.map(valuation => buildFeeEntryCreateEntity(params.id, entry, valuation))),
                { concurrency: 'unbounded' }
            );
        });

        const persistTransferConversion = Effect.fnUntraced(
            function* (
                params: ConvertToTransferParamsInterface,
                direction: 'expense' | 'income',
                conversion: TransferConversionResultInterface,
                debtAccountId: number | null
            ) {
                const updated = yield* transactionRepository.updateById(params.id, {
                    type: conversion.transactionType,
                    fromAccountId: conversion.fromAccountId,
                    toAccountId: conversion.toAccountId,
                    exchangeRate: conversion.exchangeRate
                });

                const [creditValuation, debitValuation] = yield* Effect.all(
                    [
                        entryBaseValuationService.valueMicroUnitEntry({
                            accountId: conversion.creditAccountId,
                            amount: conversion.creditAmount,
                            operatedAt: conversion.operatedAt
                        }),
                        entryBaseValuationService.valueMicroUnitEntry({
                            accountId: conversion.debitAccountId,
                            amount: conversion.debitAmount,
                            operatedAt: conversion.operatedAt
                        })
                    ],
                    { concurrency: 'unbounded' }
                );
                const feeEntries = yield* buildConversionFeeEntries(params, conversion);

                if (isDefined(debtAccountId)) {
                    yield* debtEventRepository.deleteByTransactionId(params.id);
                }
                yield* transactionEntryRepository.deleteLedgerByTransactionId(params.id);
                const isExpense = direction === 'expense';

                yield* transactionEntryRepository.bulkCreate([
                    {
                        ...buildTransferEntryCreateEntity({
                            transactionId: params.id,
                            accountId: conversion.creditAccountId,
                            type: TransactionEntryTypeEnum.CREDIT,
                            amount: conversion.creditAmount,
                            valuation: creditValuation
                        }),
                        ...(isExpense && conversion.operation)
                    },
                    {
                        ...buildTransferEntryCreateEntity({
                            transactionId: params.id,
                            accountId: conversion.debitAccountId,
                            type: TransactionEntryTypeEnum.DEBIT,
                            amount: conversion.debitAmount,
                            valuation: debitValuation
                        }),
                        ...(!isExpense && conversion.operation)
                    },
                    ...feeEntries
                ]);

                yield* accountBalanceIncrementalService.updateBalancesByAccountIds([
                    conversion.creditAccountId,
                    conversion.debitAccountId,
                    ...feeEntries.map(entry => entry.accountId),
                    ...(isDefined(debtAccountId) ? [debtAccountId] : [])
                ]);

                return updated;
            },
            effect => Db.transaction(effect)
        );

        const convertToTransfer = Effect.fnUntraced(
            function* (params: ConvertToTransferParamsInterface, direction: 'expense' | 'income', counterAmount: number | null) {
                const conversion = yield* buildTransferConversion(direction, params, counterAmount);
                const debtEvent = yield* debtEventRepository.findByTransactionId(params.id);

                return yield* persistTransferConversion(params, direction, conversion, debtEvent?.debtAccountId ?? null);
            },
            effect => Db.transaction(effect)
        );

        const convertToTransferAccount = Effect.fn('TransactionTransferService.convertToTransferAccount')(
            function* (transactionId: number, targetAccountId: number) {
                const transaction = yield* transactionRepository.getByIdWithEntries(transactionId);

                if (
                    !isDefined(transaction) ||
                    isDefined(transaction.deletedAt) ||
                    isDefined(transaction.consolidationType) ||
                    isDefined(transaction.consolidationParentTransactionId)
                ) {
                    return false;
                }

                const isExpense = transaction.type === TransactionTypeEnum.EXPENSE;
                const sourceAccountId = isExpense ? transaction.fromAccountId : transaction.toAccountId;
                const isConvertible =
                    (isExpense || transaction.type === TransactionTypeEnum.INCOME) &&
                    isDefined(sourceAccountId) &&
                    sourceAccountId !== targetAccountId &&
                    getTransactionCategoryEntries(transaction.entries).length === 1;

                if (!isConvertible) {
                    return false;
                }

                const fromAccountId = isExpense ? sourceAccountId : targetAccountId;
                const toAccountId = isExpense ? targetAccountId : sourceAccountId;
                const [fromAccount, toAccount, debtEvent] = yield* Effect.all(
                    [
                        accountRepository.findById(fromAccountId),
                        accountRepository.findById(toAccountId),
                        debtEventRepository.findByTransactionId(transactionId)
                    ],
                    { concurrency: 'unbounded' }
                );

                if (
                    !isDefined(fromAccount) ||
                    fromAccount.type === AccountTypeEnum.DEBT ||
                    !isDefined(toAccount) ||
                    toAccount.type === AccountTypeEnum.DEBT ||
                    isDefined(debtEvent)
                ) {
                    return false;
                }

                const direction = isExpense ? 'expense' : 'income';
                const params: ConvertToTransferParamsInterface = {
                    id: transactionId,
                    accountId: targetAccountId,
                    customExchangeRate: 0,
                    feeEntries: []
                };
                const conversion = yield* computeTransferConversion({
                    direction,
                    params,
                    transaction,
                    fromAccount,
                    toAccount,
                    counterAmount: null
                });

                yield* persistTransferConversion(params, direction, conversion, null);

                return true;
            },
            effect => Db.transaction(effect)
        );

        return {
            convertToTransferAccount,
            convertManyToTransferAccount: Effect.fn('TransactionTransferService.convertManyToTransferAccount')(
                function* (transactionIds: readonly number[], targetAccountId: number) {
                    const convertedIds: number[] = [];

                    for (const transactionId of transactionIds) {
                        if (yield* convertToTransferAccount(transactionId, targetAccountId)) {
                            convertedIds.push(transactionId);
                        }
                    }

                    return convertedIds;
                },
                effect => Db.transaction(effect)
            ),
            convertExpenseToTransfer: Effect.fn('TransactionTransferService.convertExpenseToTransfer')(function* (
                params: ConvertToTransferParamsInterface
            ) {
                return yield* convertToTransfer(params, 'expense', null);
            }),
            convertIncomeToTransfer: Effect.fn('TransactionTransferService.convertIncomeToTransfer')(function* (
                params: ConvertToTransferParamsInterface
            ) {
                return yield* convertToTransfer(params, 'income', null);
            }),
            startDepositFromExpense: Effect.fn('TransactionTransferService.startDepositFromExpense')(
                function* (transactionId: number, input: StartDepositInputInterface) {
                    const { receivingAmount, ...depositInput } = input;
                    const transaction = yield* getTransferConversionTransaction(
                        transactionId,
                        'expense',
                        t`Consolidated transactions cannot start a deposit`
                    );

                    const receivingMicroUnits = convertToMicroUnits(receivingAmount);

                    if (!isPositiveNumber(receivingMicroUnits) || !Number.isSafeInteger(receivingMicroUnits)) {
                        return yield* Effect.die(new Error(t`Receiving amount must be greater than zero`));
                    }

                    const transferAccountId = yield* requireTransferAccountId(transaction.fromAccountId, 'source');
                    const sourceAccount = yield* accountService.findByIdOrFail(transferAccountId);
                    const [sourceEntry] = getTransactionCategoryEntries(transaction.entries);

                    if (!isPositiveNumber(sourceEntry.amount) || !Number.isSafeInteger(sourceEntry.amount)) {
                        return yield* Effect.die(new Error('Invalid funding amount'));
                    }

                    if (depositInput.instrumentId === sourceAccount.instrumentId && receivingMicroUnits !== sourceEntry.amount) {
                        return yield* DepositReceivingAmountMismatchError.make();
                    }
                    const depositAccount = yield* accountService.createDeposit({
                        ...depositInput,
                        type: AccountTypeEnum.DEPOSIT,
                        iban: null,
                        integrationId: sourceAccount.integrationId,
                        currentBalance: 0
                    });

                    yield* convertToTransfer(
                        { id: transactionId, accountId: depositAccount.id, customExchangeRate: 0, feeEntries: [] },
                        'expense',
                        receivingMicroUnits
                    );

                    return depositAccount;
                },
                effect => Db.transaction(effect)
            ),
            convertIncomeFromAccount: Effect.fn('TransactionTransferService.convertIncomeFromAccount')(function* (
                transactionId: number,
                sourceAccountId: number,
                sourceAmount: number
            ) {
                return yield* convertToTransfer(
                    { id: transactionId, accountId: sourceAccountId, customExchangeRate: 0, feeEntries: [] },
                    'income',
                    sourceAmount
                );
            })
        };
    })
}) {
    static readonly layer = Layer.effect(TransactionTransferService, TransactionTransferService.make).pipe(
        Layer.provide([
            AccountRepository.layer,
            DebtEventRepository.layer,
            TransactionEntryRepository.layer,
            TransactionRepository.layer,
            AccountBalanceIncrementalService.layer,
            AccountService.layer,
            ExchangeRatesService.layer,
            EntryBaseValuationService.layer
        ])
    );
}
