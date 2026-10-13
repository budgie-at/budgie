import { consolidationScopeService } from '@budgie/consolidation';
import { AccountRepository, ExternalSourceEnum, TransactionRepository, YIELD_TO_UI, convertToMicroUnits } from '@budgie/contracts';
import { TransactionService } from '@budgie/ledger';
import * as Cause from 'effect/Cause';
import * as Context from 'effect/Context';
import * as Effect from 'effect/Effect';
import * as Exit from 'effect/Exit';
import * as Layer from 'effect/Layer';
import * as Reactivity from 'effect/reactivity/Reactivity';
import * as Semaphore from 'effect/Semaphore';

import { isDefined, isNotEmptyArray } from '@rnw-community/shared';

import { TransferConsolidationDrainerService } from '../../sync/service/transfer-consolidation-drainer.service';
import { WalletCaptureReactivityKeyEnum } from '../enum/wallet-capture-reactivity-key.enum';
import { WalletCaptureReviewReasonEnum } from '../enum/wallet-capture-review-reason.enum';
import { WalletCaptureStatusEnum } from '../enum/wallet-capture-status.enum';

import { WalletCaptureNativeService } from './wallet-capture-native.service';
import { WalletCaptureTransactionService } from './wallet-capture-transaction.service';

import type { WalletCaptureNativeRecordInterface } from '../interface/wallet-capture-native-record.interface';
import type { WalletCaptureReviewItemInterface } from '../interface/wallet-capture-review-item.interface';
import type { Db, DbError, TransactionEntityInterface } from '@budgie/contracts';

export class WalletCaptureImportService extends Context.Service<WalletCaptureImportService>()('@budgie/app/WalletCaptureImportService', {
    make: Effect.gen(function* () {
        const accountRepository = yield* AccountRepository;
        const transactionRepository = yield* TransactionRepository;
        const transactionService = yield* TransactionService;
        const nativeService = yield* WalletCaptureNativeService;
        const captureTransactionService = yield* WalletCaptureTransactionService;
        const transferConsolidationDrainerService = yield* TransferConsolidationDrainerService;
        const lock = yield* Semaphore.make(1);
        const reactivity = yield* Reactivity.Reactivity;
        const duplicateWindowSeconds = 120;

        const resolveUnavailableReason = Effect.fnUntraced(function* (record: WalletCaptureNativeRecordInterface) {
            const account = yield* accountRepository.findById(record.accountId);

            if (!isDefined(account) || !account.isActive) {
                return WalletCaptureReviewReasonEnum.ACCOUNT_UNAVAILABLE;
            }

            return isDefined(yield* captureTransactionService.resolveAccountAmount(record))
                ? null
                : WalletCaptureReviewReasonEnum.CURRENCY_UNAVAILABLE;
        });

        const resolveReviewItem = Effect.fnUntraced(function* (
            record: WalletCaptureNativeRecordInterface
        ): Effect.fn.Return<WalletCaptureReviewItemInterface | null, DbError, Db> {
            if (record.status === WalletCaptureStatusEnum.NEEDS_REVIEW) {
                const duplicateTransactionId = record.duplicateTransactionId ?? null;

                return {
                    capture: record,
                    duplicateTransactionId,
                    reason: isDefined(duplicateTransactionId)
                        ? WalletCaptureReviewReasonEnum.DUPLICATE
                        : WalletCaptureReviewReasonEnum.INVALID_PAYLOAD
                };
            }

            const unavailableReason = yield* resolveUnavailableReason(record);

            return isDefined(unavailableReason) ? { capture: record, duplicateTransactionId: null, reason: unavailableReason } : null;
        });

        const importAndAcknowledgeCapture = Effect.fnUntraced(function* (
            record: WalletCaptureNativeRecordInterface,
            importedTransactionId: number | undefined
        ) {
            const transactionId = isDefined(importedTransactionId)
                ? yield* captureTransactionService
                      .applyRulesToExistingCaptureTransaction(record, importedTransactionId)
                      .pipe(Effect.as(importedTransactionId))
                : yield* captureTransactionService.createCaptureTransaction(record);
            yield* nativeService.acknowledgeCaptures([record.captureId]);

            return { id: transactionId, operatedAt: new Date(record.capturedAt) };
        });

        const enqueueConsolidation = (importedCaptures: readonly Pick<TransactionEntityInterface, 'id' | 'operatedAt'>[]) => {
            const scope = consolidationScopeService.buildFromTransactions([...importedCaptures]);

            return isDefined(scope) ? transferConsolidationDrainerService.enqueue(scope) : Effect.void;
        };

        const findDuplicateCapture = Effect.fnUntraced(function* (record: WalletCaptureNativeRecordInterface) {
            const accountAmount = yield* captureTransactionService.resolveAccountAmount(record);

            if (!isDefined(accountAmount)) {
                return null;
            }

            return yield* transactionRepository.findPotentialExpenseDuplicate({
                accountId: record.accountId,
                amountInMicroUnits: convertToMicroUnits(accountAmount.amount),
                normalizedTitle: record.merchant.trim().toLocaleLowerCase(),
                operatedAt: new Date(record.capturedAt),
                timeWindowSeconds: duplicateWindowSeconds
            });
        });

        const processCapture = Effect.fnUntraced(function* (
            record: WalletCaptureNativeRecordInterface,
            importedIds: Map<string, number>,
            importedCaptures: Pick<TransactionEntityInterface, 'id' | 'operatedAt'>[]
        ) {
            const importedTransactionId = importedIds.get(record.captureId);

            if (!isDefined(importedTransactionId)) {
                const reviewItem = yield* resolveReviewItem(record);

                if (isDefined(reviewItem)) {
                    return reviewItem;
                }

                const duplicateTransactionId = yield* findDuplicateCapture(record);

                if (isDefined(duplicateTransactionId)) {
                    yield* nativeService.markNeedsReview(record.captureId, duplicateTransactionId);

                    return { capture: record, duplicateTransactionId, reason: WalletCaptureReviewReasonEnum.DUPLICATE };
                }
            }

            importedCaptures.push(yield* importAndAcknowledgeCapture(record, importedTransactionId));

            return null;
        });

        return {
            drain: Effect.fn('WalletCaptureImportService.drain')(
                function* () {
                    const records = yield* nativeService.getCaptures();
                    const importedIds = yield* transactionService.findIdMapByExternalSource(ExternalSourceEnum.APPLE_PAY_AUTOMATION);
                    const importedCaptures: Pick<TransactionEntityInterface, 'id' | 'operatedAt'>[] = [];

                    const results = yield* Effect.forEach(records, record =>
                        Effect.gen(function* () {
                            const result = yield* Effect.exit(processCapture(record, importedIds, importedCaptures));
                            if (Exit.isFailure(result) && Cause.hasInterrupts(result.cause)) {
                                return yield* Effect.failCause(result.cause);
                            }

                            yield* YIELD_TO_UI;

                            return result;
                        })
                    );
                    const failures = results.filter(Exit.isFailure);

                    yield* enqueueConsolidation(importedCaptures);

                    if (isNotEmptyArray(failures)) {
                        return yield* Effect.failCause(
                            failures.map(failure => failure.cause).reduce((left, right) => Cause.combine(left, right))
                        );
                    }

                    return results
                        .filter(Exit.isSuccess)
                        .map(result => result.value)
                        .filter(isDefined);
                },
                effect =>
                    lock.withPermit(
                        reactivity.withBatch(effect.pipe(Effect.ensuring(reactivity.invalidate([WalletCaptureReactivityKeyEnum.CAPTURES]))))
                    )
            ),
            forceImport: Effect.fn('WalletCaptureImportService.forceImport')(
                function* (captureId: string) {
                    const record = (yield* nativeService.getCaptures()).find(
                        capture => capture.captureId === captureId && capture.status === WalletCaptureStatusEnum.NEEDS_REVIEW
                    );

                    if (!isDefined(record) || isDefined(yield* resolveUnavailableReason(record))) {
                        return;
                    }

                    yield* enqueueConsolidation([
                        yield* importAndAcknowledgeCapture(
                            record,
                            (yield* transactionService.findIdMapByExternalSource(ExternalSourceEnum.APPLE_PAY_AUTOMATION)).get(
                                record.captureId
                            )
                        )
                    ]);
                },
                effect => lock.withPermit(effect)
            ),
            dismiss: Effect.fn('WalletCaptureImportService.dismiss')(
                function* (captureId: string) {
                    const record = (yield* nativeService.getCaptures()).find(capture => capture.captureId === captureId);

                    if (isDefined(record) && isDefined(yield* resolveReviewItem(record))) {
                        yield* nativeService.acknowledgeCaptures([record.captureId]);
                    }
                },
                effect => lock.withPermit(effect)
            ),
            getReviewItems: Effect.fn('WalletCaptureImportService.getReviewItems')(function* () {
                return (yield* Effect.forEach(yield* nativeService.getCaptures(), record => resolveReviewItem(record))).filter(isDefined);
            })
        };
    })
}) {
    static readonly layer = Layer.effect(WalletCaptureImportService, WalletCaptureImportService.make).pipe(
        Layer.provide([
            AccountRepository.layer,
            TransactionRepository.layer,
            TransactionService.layer,
            TransferConsolidationDrainerService.layer,
            WalletCaptureNativeService.layer,
            WalletCaptureTransactionService.layer
        ])
    );
}
