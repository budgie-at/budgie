import {
    AccountBalanceRepository,
    CategorySourceEnum,
    Db,
    DebtEventRepository,
    TransactionEntryCreateEntityInterface,
    TransactionEntryKindEnum,
    TransactionEntryRepository,
    TransactionEntryTypeEnum,
    TransactionRepository,
    TransactionTypeEnum
} from '@budgie/contracts';
import { EntryBaseValuationService, ExchangeRatesService } from '@budgie/market';
import { i18n } from '@lingui/core';
import { t } from '@lingui/core/macro';
import * as Context from 'effect/Context';
import * as Effect from 'effect/Effect';
import * as Layer from 'effect/Layer';

import { isDefined, isNotEmptyArray, isPositiveNumber } from '@rnw-community/shared';

import { convertFromMicroUnits } from '../../@generic/util/convert-from-micro-units.util';
import { DepositNegativeBalanceError } from '../../account/error/deposit-negative-balance.error';
import { AccountArchiveService } from '../../account/service/account-archive.service';
import { AccountBalanceIncrementalService } from '../../account/service/account-balance-incremental.service';
import { AccountService } from '../../account/service/account.service';
import { TRANSFER_CONVERSION_ERROR_MESSAGE } from '../constant/transfer-conversion-error-message.constant';
import { BuildTransferEntryCreateEntityInputInterface } from '../interface/build-transfer-entry-create-entity-input.interface';
import { TransferConversionResultInterface } from '../interface/transfer-conversion-result.interface';
import { assertTransferAccountsAreNotDebt } from '../util/assert-transfer-accounts-are-not-debt.util';
import { buildTransferEntries } from '../util/build-transfer-entries.util';
import { createTransactionInput } from '../util/create-transaction-input.util';
import { getTransactionCategoryEntries } from '../util/get-transaction-category-entries.util';
import { getTransactionFeeEntries } from '../util/get-transaction-fee-entries.util';
import { transactionMapEntryInputToCreateEntity } from '../util/transaction-map-entry-input-to-create-entity.util';

import { TransferCreationService } from './transfer-creation.service';

import type { ConvertToTransferParamsInterface } from '../interface/convert-to-transfer-params.interface';
import type { TransactionEntryEntityInterface } from '@budgie/contracts';
import type { EntryBaseValuationInterface } from '@budgie/market';

export class TransactionTransferService extends Context.Service<TransactionTransferService>()('@budgie/ledger/TransactionTransferService', {
    make: Effect.gen(function* () {
        const accountBalanceRepository = yield* AccountBalanceRepository;
        const debtEventRepository = yield* DebtEventRepository;
        const transactionEntryRepository = yield* TransactionEntryRepository;
        const transactionRepository = yield* TransactionRepository;
        const accountBalanceIncrementalService = yield* AccountBalanceIncrementalService;
        const accountArchiveService = yield* AccountArchiveService;
        const accountService = yield* AccountService;
        const exchangeRatesService = yield* ExchangeRatesService;
        const entryBaseValuationService = yield* EntryBaseValuationService;
        const transferCreationService = yield* TransferCreationService;

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

        const getTransferConversionTransaction = Effect.fnUntraced(function* (id: number, direction: 'expense' | 'income') {
            const transaction = yield* transactionRepository.getByIdWithEntries(id);

            if (!isDefined(transaction)) {
                return yield* Effect.die(new Error(t`Transaction not found`));
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

        const buildTransferConversion = Effect.fnUntraced(function* (
            direction: 'expense' | 'income',
            params: ConvertToTransferParamsInterface
        ) {
            const transaction = yield* getTransferConversionTransaction(params.id, direction);
            const [transactionEntry] = getTransactionCategoryEntries(transaction.entries);
            const hasCustomRate = isPositiveNumber(params.customExchangeRate) && params.customExchangeRate !== 1;
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

            const conversion = yield* exchangeRatesService.convert(
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
                creditAccountId: fromAccountId,
                creditAmount: isExpense ? transactionEntry.amount : convertedAmount,
                debitAccountId: toAccountId,
                debitAmount: isExpense ? convertedAmount : transactionEntry.amount,
                exchangeRate,
                fromAccountId,
                operatedAt: transaction.operatedAt,
                toAccountId,
                transactionType: TransactionTypeEnum.TRANSFER,
                feeEntries: getTransactionFeeEntries(transaction.entries)
            } satisfies TransferConversionResultInterface;
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

        const convertToTransfer = Effect.fnUntraced(
            function* (params: ConvertToTransferParamsInterface, direction: 'expense' | 'income') {
                const conversion = yield* buildTransferConversion(direction, params);
                const debtEvent = yield* debtEventRepository.findByTransactionId(params.id);
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

                yield* debtEventRepository.deleteByTransactionId(params.id);
                yield* transactionEntryRepository.deleteByTransactionId(params.id);
                yield* transactionEntryRepository.bulkCreate([
                    buildTransferEntryCreateEntity({
                        transactionId: params.id,
                        accountId: conversion.creditAccountId,
                        type: TransactionEntryTypeEnum.CREDIT,
                        amount: conversion.creditAmount,
                        valuation: creditValuation
                    }),
                    buildTransferEntryCreateEntity({
                        transactionId: params.id,
                        accountId: conversion.debitAccountId,
                        type: TransactionEntryTypeEnum.DEBIT,
                        amount: conversion.debitAmount,
                        valuation: debitValuation
                    }),
                    ...feeEntries
                ]);

                yield* accountBalanceIncrementalService.updateBalancesByAccountIds([
                    conversion.creditAccountId,
                    conversion.debitAccountId,
                    ...feeEntries.map(entry => entry.accountId),
                    ...(isDefined(debtEvent) ? [debtEvent.debtAccountId] : [])
                ]);

                return updated;
            },
            effect => Db.transaction(effect)
        );

        const resolveDepositCloseExchangeRate = Effect.fnUntraced(function* (
            fromInstrumentId: number,
            toInstrumentId: number,
            amountInMicroUnits: number
        ) {
            if (fromInstrumentId === toInstrumentId) {
                return 1;
            }

            const conversion = yield* exchangeRatesService.convertStrict(fromInstrumentId, toInstrumentId, amountInMicroUnits);

            if (!isDefined(conversion) || !isPositiveNumber(conversion.amount)) {
                // oxlint-disable-next-line lingui/no-unlocalized-strings -- Internal error, surfaced via caller's Toast
                return yield* Effect.die(new Error('No exchange rate available to close this deposit into the selected account'));
            }

            return amountInMicroUnits / conversion.amount;
        });

        const buildDepositCloseTransferInput = Effect.fnUntraced(function* (
            depositAccountId: number,
            destinationAccountId: number,
            amountInMicroUnits: number
        ) {
            const [depositAccount, destinationAccount] = yield* Effect.all(
                [accountService.findByIdOrFail(depositAccountId), accountService.findByIdOrFail(destinationAccountId)],
                { concurrency: 'unbounded' }
            );
            const exchangeRate = yield* resolveDepositCloseExchangeRate(
                depositAccount.instrumentId,
                destinationAccount.instrumentId,
                amountInMicroUnits
            );
            const amount = convertFromMicroUnits(amountInMicroUnits);

            return createTransactionInput({
                type: TransactionTypeEnum.TRANSFER,
                fromAccountId: depositAccountId,
                toAccountId: destinationAccountId,
                amount,
                exchangeRate,
                entries: buildTransferEntries({
                    fromAccountId: depositAccountId,
                    toAccountId: destinationAccountId,
                    amount
                })
            });
        });

        return {
            convertExpenseToTransfer: Effect.fn('TransactionTransferService.convertExpenseToTransfer')(function* (
                params: ConvertToTransferParamsInterface
            ) {
                return yield* convertToTransfer(params, 'expense');
            }),
            convertIncomeToTransfer: Effect.fn('TransactionTransferService.convertIncomeToTransfer')(function* (
                params: ConvertToTransferParamsInterface
            ) {
                return yield* convertToTransfer(params, 'income');
            }),
            closeDepositTo: Effect.fn('TransactionTransferService.closeDepositTo')(
                function* (depositAccountId: number, destinationAccountId: number) {
                    const depositBalanceRows = yield* accountBalanceRepository.getByAccountId(depositAccountId);
                    const depositBalanceMicroUnits = depositBalanceRows.at(0)?.balance ?? 0;

                    if (depositBalanceMicroUnits < 0) {
                        return yield* new DepositNegativeBalanceError();
                    }

                    if (isPositiveNumber(depositBalanceMicroUnits)) {
                        const transferInput = yield* buildDepositCloseTransferInput(
                            depositAccountId,
                            destinationAccountId,
                            depositBalanceMicroUnits
                        );
                        yield* transferCreationService.createInternalTransfer(transferInput);
                    }

                    yield* accountArchiveService.archiveByIdInTransaction(depositAccountId);
                },
                effect => Db.transaction(effect)
            )
        };
    })
}) {
    static readonly layer = Layer.effect(TransactionTransferService, TransactionTransferService.make).pipe(
        Layer.provide([
            AccountBalanceRepository.layer,
            DebtEventRepository.layer,
            TransactionEntryRepository.layer,
            TransactionRepository.layer,
            AccountBalanceIncrementalService.layer,
            AccountArchiveService.layer,
            AccountService.layer,
            ExchangeRatesService.layer,
            EntryBaseValuationService.layer,
            TransferCreationService.layer
        ])
    );
}
