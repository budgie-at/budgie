import {
    CategorySourceEnum,
    Db,
    TransactionEntryCreateEntityInterface,
    TransactionEntryKindEnum,
    TransactionEntryTypeEnum,
    TransactionTypeEnum
} from '@budgie/contracts';
import { i18n } from '@lingui/core';
import { t } from '@lingui/core/macro';
import * as Effect from 'effect/Effect';

import { isDefined, isPositiveNumber } from '@rnw-community/shared';

import { accountBalanceRepository, transactionEntryRepository, transactionRepository } from '../../@generic/drizzle/db/db';
import { invalidateDatabaseLiveQuery } from '../../@generic/drizzle/utils/invalidate-database-live-query.util';
import { convertFromMicroUnits } from '../../@generic/utils/convert-from-micro-units.util';
import { accountBalanceIncrementalService } from '../../account/service/account-balance-incremental.service';
import { accountService } from '../../account/service/account.service';
import { exchangeRatesService } from '../../exchange-rate/service/exchange-rates.service';
import { entryBaseValuationService } from '../../money-data/service/entry-base-valuation.service';
import { TRANSFER_CONVERSION_ERROR_MESSAGE } from '../constant/transfer-conversion-error-message.constant';
import { BuildTransferEntryCreateEntityInputInterface } from '../interface/build-transfer-entry-create-entity-input.interface';
import { TransferConversionResultInterface } from '../interface/transfer-conversion-result.interface';
import { assertTransferAccountsAreNotDebt } from '../utils/assert-transfer-accounts-are-not-debt.util';
import { buildTransferEntries } from '../utils/build-transfer-entries.util';
import { createTransactionInput } from '../utils/create-transaction-input.util';
import { getTransactionCategoryEntries } from '../utils/get-transaction-category-entries.util';
import { getTransactionFeeEntries } from '../utils/get-transaction-fee-entries.util';

import { transactionService } from './transaction.service';

import type { EntryBaseValuationInterface } from '../../money-data/interface/entry-base-valuation.interface';
import type { ConvertToTransferParamsInterface } from '../interface/convert-to-transfer-params.interface';
import type { TransactionEntryEntityInterface } from '@budgie/contracts';

class TransactionTransferService {
    readonly convertExpenseToTransfer = Effect.fn('TransactionTransferService.convertExpenseToTransfer')(function* (
        this: TransactionTransferService,
        params: ConvertToTransferParamsInterface
    ) {
        return yield* this.convertToTransfer(params, 'expense');
    }, invalidateDatabaseLiveQuery);

    readonly convertIncomeToTransfer = Effect.fn('TransactionTransferService.convertIncomeToTransfer')(function* (
        this: TransactionTransferService,
        params: ConvertToTransferParamsInterface
    ) {
        return yield* this.convertToTransfer(params, 'income');
    }, invalidateDatabaseLiveQuery);

    readonly closeDepositTo = Effect.fn('TransactionTransferService.closeDepositTo')(
        function* (this: TransactionTransferService, depositAccountId: number, destinationAccountId: number) {
            const depositBalanceRows = yield* Db.query(db => accountBalanceRepository.getByAccountId(depositAccountId, db));
            const depositBalanceMicroUnits = depositBalanceRows.at(0)?.balance ?? 0;

            if (depositBalanceMicroUnits < 0) {
                // oxlint-disable-next-line lingui/no-unlocalized-strings -- Internal error, surfaced via caller's Toast
                yield* Effect.die(new Error('Cannot close a deposit with a negative balance'));
            }

            if (isPositiveNumber(depositBalanceMicroUnits)) {
                const transferInput = yield* this.buildDepositCloseTransferInput(
                    depositAccountId,
                    destinationAccountId,
                    depositBalanceMicroUnits
                );
                yield* transactionService.createInternalTransfer(transferInput);
            }

            yield* accountService.archiveByIdInTransaction(depositAccountId);
        },
        effect => Db.transaction(effect),
        invalidateDatabaseLiveQuery
    );

    private readonly convertToTransfer = Effect.fnUntraced(
        function* (this: TransactionTransferService, params: ConvertToTransferParamsInterface, direction: 'expense' | 'income') {
            const conversion = yield* this.buildTransferConversion(direction, params);
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
                        operatedAt: conversion.operatedAt,
                        externalSource: null
                    }),
                    entryBaseValuationService.valueMicroUnitEntry({
                        accountId: conversion.debitAccountId,
                        amount: conversion.debitAmount,
                        operatedAt: conversion.operatedAt,
                        externalSource: null
                    })
                ],
                { concurrency: 'unbounded' }
            );
            const feeValuations = yield* Effect.forEach(
                conversion.feeEntries,
                entry =>
                    entryBaseValuationService.valueMicroUnitEntry({
                        accountId: entry.accountId,
                        amount: entry.amount,
                        operatedAt: conversion.operatedAt,
                        externalSource: null
                    }),
                { concurrency: 'unbounded' }
            );

            yield* transactionEntryRepository.deleteByTransactionId(params.id);
            yield* transactionEntryRepository.bulkCreate([
                this.buildTransferEntryCreateEntity({
                    transactionId: params.id,
                    accountId: conversion.creditAccountId,
                    type: TransactionEntryTypeEnum.CREDIT,
                    amount: conversion.creditAmount,
                    valuation: creditValuation
                }),
                this.buildTransferEntryCreateEntity({
                    transactionId: params.id,
                    accountId: conversion.debitAccountId,
                    type: TransactionEntryTypeEnum.DEBIT,
                    amount: conversion.debitAmount,
                    valuation: debitValuation
                }),
                ...conversion.feeEntries.map((entry, index) => this.buildFeeEntryCreateEntity(params.id, entry, feeValuations[index]))
            ]);

            yield* accountBalanceIncrementalService.updateBalancesByAccountIds([
                conversion.creditAccountId,
                conversion.debitAccountId,
                ...conversion.feeEntries.map(entry => entry.accountId)
            ]);

            return updated;
        },
        effect => Db.transaction(effect)
    );

    private readonly buildTransferConversion = Effect.fnUntraced(function* (
        this: TransactionTransferService,
        direction: 'expense' | 'income',
        params: ConvertToTransferParamsInterface
    ) {
        const transaction = yield* this.getTransferConversionTransaction(params.id, direction);
        const [transactionEntry] = getTransactionCategoryEntries(transaction.entries);
        const hasCustomRate = isPositiveNumber(params.customExchangeRate) && params.customExchangeRate !== 1;
        const isExpense = direction === 'expense';
        const fromAccountId = isExpense ? yield* this.requireTransferAccountId(transaction.fromAccountId, 'source') : params.accountId;
        const toAccountId = isExpense ? params.accountId : yield* this.requireTransferAccountId(transaction.toAccountId, 'destination');
        const [fromAccount, toAccount] = yield* Effect.all(
            [accountService.findByIdIncludingArchivedOrFail(fromAccountId), accountService.findByIdIncludingArchivedOrFail(toAccountId)],
            { concurrency: 'unbounded' }
        );

        yield* assertTransferAccountsAreNotDebt([fromAccount, toAccount]);

        const conversion = yield* exchangeRatesService.convert(
            isExpense ? fromAccount.instrumentId : toAccount.instrumentId,
            isExpense ? toAccount.instrumentId : fromAccount.instrumentId,
            transactionEntry.amount
        );
        const exchangeRate = hasCustomRate && isDefined(params.customExchangeRate) ? params.customExchangeRate : conversion.exchangeRate;
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

    private readonly getTransferConversionTransaction = Effect.fnUntraced(function* (id: number, direction: 'expense' | 'income') {
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

    private readonly buildDepositCloseTransferInput = Effect.fnUntraced(function* (
        this: TransactionTransferService,
        depositAccountId: number,
        destinationAccountId: number,
        amountInMicroUnits: number
    ) {
        const [depositAccount, destinationAccount] = yield* Effect.all(
            [accountService.findByIdOrFail(depositAccountId), accountService.findByIdOrFail(destinationAccountId)],
            { concurrency: 'unbounded' }
        );
        const exchangeRate = yield* this.resolveDepositCloseExchangeRate(
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

    private readonly resolveDepositCloseExchangeRate = Effect.fnUntraced(function* (
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

    private buildFeeEntryCreateEntity(
        transactionId: number,
        entry: TransactionEntryEntityInterface,
        valuation: EntryBaseValuationInterface
    ): TransactionEntryCreateEntityInterface {
        return {
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
        };
    }

    private buildTransferEntryCreateEntity({
        transactionId,
        accountId,
        type,
        amount,
        valuation
    }: BuildTransferEntryCreateEntityInputInterface): TransactionEntryCreateEntityInterface {
        return {
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
        };
    }

    private requireTransferAccountId(accountId: number | null, kind: 'source' | 'destination') {
        if (isDefined(accountId)) {
            return Effect.succeed(accountId);
        }

        return Effect.die(
            new Error(kind === 'source' ? t`Transaction must have a source account` : t`Transaction must have a destination account`)
        );
    }
}

export const transactionTransferService = new TransactionTransferService();
