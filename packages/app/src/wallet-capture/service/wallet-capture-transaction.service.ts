import {
    AccountRepository,
    CategorySourceEnum,
    ExternalSourceEnum,
    InstrumentRepository,
    TransactionEntryTypeEnum,
    TransactionTypeEnum,
    convertFromMicroUnits,
    convertToMicroUnits
} from '@budgie/contracts';
import { TransactionService } from '@budgie/ledger';
import { EntryBaseValuationService } from '@budgie/market';
import { RuleEngineService } from '@budgie/rules';
import { i18n } from '@lingui/core';
import { msg } from '@lingui/core/macro';
import * as Context from 'effect/Context';
import * as Effect from 'effect/Effect';
import * as Layer from 'effect/Layer';

import { isDefined, isNotEmptyArray, isNotEmptyString, isPositiveNumber } from '@rnw-community/shared';

import type { WalletCaptureAccountAmountInterface } from '../interface/wallet-capture-account-amount.interface';
import type { WalletCaptureNativeRecordInterface } from '../interface/wallet-capture-native-record.interface';
import type { TransactionCreateInputInterface } from '@budgie/contracts';

export class WalletCaptureTransactionService extends Context.Service<WalletCaptureTransactionService>()(
    '@budgie/app/WalletCaptureTransactionService',
    {
        make: Effect.gen(function* () {
            const accountRepository = yield* AccountRepository;
            const instrumentRepository = yield* InstrumentRepository;
            const entryBaseValuationService = yield* EntryBaseValuationService;
            const ruleEngineService = yield* RuleEngineService;
            const transactionService = yield* TransactionService;

            const resolveAccountAmount = Effect.fn('WalletCaptureTransactionService.resolveAccountAmount')(function* (
                record: WalletCaptureNativeRecordInterface
            ) {
                const account = yield* accountRepository.findById(record.accountId);
                const currencyCode = record.currency?.trim().toUpperCase() ?? '';

                if (!isDefined(account)) {
                    return null;
                }

                const sameCurrencyAmount: WalletCaptureAccountAmountInterface = { amount: record.amount, exchangeRate: 1 };

                if (!isNotEmptyString(currencyCode)) {
                    return sameCurrencyAmount;
                }

                const operationInstrument = yield* instrumentRepository.findByCode(currencyCode);

                if (!isDefined(operationInstrument)) {
                    return null;
                }

                if (operationInstrument.id === account.instrumentId) {
                    return sameCurrencyAmount;
                }

                const exchangeRate = yield* entryBaseValuationService.resolveHistoricalBaseExchangeRateOrNull(
                    operationInstrument.id,
                    account.instrumentId,
                    new Date(record.capturedAt)
                );

                if (!isPositiveNumber(exchangeRate)) {
                    return null;
                }

                const amount = convertFromMicroUnits(Math.round(convertToMicroUnits(record.amount) * exchangeRate));
                const foreignCurrencyAmount: WalletCaptureAccountAmountInterface = { amount, exchangeRate: amount / record.amount };

                return foreignCurrencyAmount;
            });

            const mapCaptureToTransactionInput = (
                record: WalletCaptureNativeRecordInterface,
                accountAmount: WalletCaptureAccountAmountInterface
            ): TransactionCreateInputInterface => ({
                amount: accountAmount.amount,
                title: isNotEmptyString(record.merchant.trim()) ? record.merchant.trim() : i18n._(msg`Apple Pay purchase`),
                comment: '',
                type: TransactionTypeEnum.EXPENSE,
                exchangeRate: accountAmount.exchangeRate,
                operatedAt: new Date(record.capturedAt),
                externalId: record.captureId,
                updatedBy: null,
                externalSource: ExternalSourceEnum.APPLE_PAY_AUTOMATION,
                fromAccountId: record.accountId,
                toAccountId: null,
                tagIds: [],
                entries: [
                    {
                        accountId: record.accountId,
                        type: TransactionEntryTypeEnum.CREDIT,
                        amount: accountAmount.amount,
                        categoryId: null,
                        categorySource: CategorySourceEnum.USER,
                        mccCategoryId: null,
                        externalId: record.captureId,
                        exchangeRate: accountAmount.exchangeRate,
                        toIban: null
                    }
                ]
            });

            const prepareCaptureForRules = Effect.fnUntraced(function* (record: WalletCaptureNativeRecordInterface) {
                const accountAmount = yield* resolveAccountAmount(record);

                if (!isDefined(accountAmount)) {
                    return yield* Effect.die(new Error(`Wallet capture ${record.captureId} has no account amount`));
                }

                return yield* ruleEngineService.prepareCreateInputsForRules([mapCaptureToTransactionInput(record, accountAmount)]);
            });

            const applyPostCreateRules = Effect.fnUntraced(function* (
                transactionInputs: TransactionCreateInputInterface[],
                postCreateIndexes: number[],
                transactionId: number
            ) {
                if (isNotEmptyArray(postCreateIndexes)) {
                    yield* ruleEngineService.applyRulesToTransactions([transactionId], transactionInputs);
                }
            });

            return {
                resolveAccountAmount,
                createCaptureTransaction: Effect.fn('WalletCaptureTransactionService.createCaptureTransaction')(function* (
                    record: WalletCaptureNativeRecordInterface
                ) {
                    const { transactionInputs, postCreateIndexes } = yield* prepareCaptureForRules(record);
                    const [createdTransaction] = yield* transactionService.bulkCreate(transactionInputs);

                    if (!isDefined(createdTransaction)) {
                        return yield* Effect.die(new Error(`Wallet capture ${record.captureId} was not created`));
                    }

                    yield* applyPostCreateRules(transactionInputs, postCreateIndexes, createdTransaction.id);

                    return createdTransaction.id;
                }),
                applyRulesToExistingCaptureTransaction: Effect.fn('WalletCaptureTransactionService.applyRulesToExistingCaptureTransaction')(
                    function* (record: WalletCaptureNativeRecordInterface, transactionId: number) {
                        const { transactionInputs, postCreateIndexes } = yield* prepareCaptureForRules(record);

                        yield* applyPostCreateRules(transactionInputs, postCreateIndexes, transactionId);
                    }
                )
            };
        })
    }
) {
    static readonly layer = Layer.effect(WalletCaptureTransactionService, WalletCaptureTransactionService.make).pipe(
        Layer.provide([
            AccountRepository.layer,
            InstrumentRepository.layer,
            EntryBaseValuationService.layer,
            RuleEngineService.layer,
            TransactionService.layer
        ])
    );
}
