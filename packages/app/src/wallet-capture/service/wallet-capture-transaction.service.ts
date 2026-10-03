import { CategorySourceEnum, ExternalSourceEnum, TransactionEntryTypeEnum, TransactionTypeEnum } from '@budgie/contracts';
import { TransactionService } from '@budgie/ledger';
import { RuleEngineService } from '@budgie/rules';
import { i18n } from '@lingui/core';
import { msg } from '@lingui/core/macro';
import * as Context from 'effect/Context';
import * as Effect from 'effect/Effect';
import * as Layer from 'effect/Layer';

import { isDefined, isNotEmptyArray, isNotEmptyString } from '@rnw-community/shared';

import type { WalletCaptureNativeRecordInterface } from '../interface/wallet-capture-native-record.interface';
import type { TransactionCreateInputInterface } from '@budgie/contracts';

export class WalletCaptureTransactionService extends Context.Service<WalletCaptureTransactionService>()(
    '@budgie/app/WalletCaptureTransactionService',
    {
        make: Effect.gen(function* () {
            const ruleEngineService = yield* RuleEngineService;
            const transactionService = yield* TransactionService;

            const mapCaptureToTransactionInput = (record: WalletCaptureNativeRecordInterface): TransactionCreateInputInterface => ({
                amount: record.amount,
                title: isNotEmptyString(record.merchant.trim()) ? record.merchant.trim() : i18n._(msg`Apple Pay purchase`),
                comment: '',
                type: TransactionTypeEnum.EXPENSE,
                exchangeRate: 1,
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
                        amount: record.amount,
                        categoryId: null,
                        categorySource: CategorySourceEnum.USER,
                        mccCategoryId: null,
                        externalId: record.captureId,
                        exchangeRate: 1,
                        toIban: null
                    }
                ]
            });

            return {
                createCaptureTransaction: Effect.fn('WalletCaptureTransactionService.createCaptureTransaction')(function* (
                    record: WalletCaptureNativeRecordInterface
                ) {
                    const prepared = yield* ruleEngineService.prepareCreateInputsForRules([mapCaptureToTransactionInput(record)]);
                    const createdTransactions = yield* transactionService.bulkCreate(prepared.transactionInputs);

                    for (const postCreateIndex of prepared.postCreateIndexes) {
                        const createdTransactionId = createdTransactions[postCreateIndex]?.id;
                        const transactionInput = prepared.transactionInputs[postCreateIndex];

                        if (isDefined(createdTransactionId) && isDefined(transactionInput)) {
                            yield* ruleEngineService.applyRulesToTransactions([createdTransactionId], [transactionInput]);
                        }
                    }

                    return createdTransactions;
                }),
                applyRulesToExistingCaptureTransaction: Effect.fn('WalletCaptureTransactionService.applyRulesToExistingCaptureTransaction')(
                    function* (record: WalletCaptureNativeRecordInterface, transactionId: number) {
                        const prepared = yield* ruleEngineService.prepareCreateInputsForRules([mapCaptureToTransactionInput(record)]);

                        if (isNotEmptyArray(prepared.postCreateIndexes)) {
                            yield* ruleEngineService.applyRulesToTransactions(
                                prepared.postCreateIndexes.map(() => transactionId),
                                prepared.postCreateIndexes.map(index => prepared.transactionInputs[index]).filter(isDefined)
                            );
                        }
                    }
                )
            };
        })
    }
) {
    static readonly layer = Layer.effect(WalletCaptureTransactionService, WalletCaptureTransactionService.make).pipe(
        Layer.provide([RuleEngineService.layer, TransactionService.layer])
    );
}
