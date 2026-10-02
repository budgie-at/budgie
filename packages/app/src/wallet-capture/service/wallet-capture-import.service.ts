import { AccountRepository, ExternalSourceEnum, TransactionRepository } from '@budgie/contracts';
import * as Cause from 'effect/Cause';
import * as Context from 'effect/Context';
import * as Effect from 'effect/Effect';
import * as Exit from 'effect/Exit';
import * as Layer from 'effect/Layer';
import * as Reactivity from 'effect/reactivity/Reactivity';
import * as Semaphore from 'effect/Semaphore';

import { isDefined, isNotEmptyArray } from '@rnw-community/shared';

import { YIELD_TO_UI } from '../../@generic/constant/yield-to-ui.constant';
import { convertToMicroUnits } from '../../@generic/utils/convert-to-micro-units.util';
import { TransactionService } from '../../transaction/service/transaction.service';
import { WalletCaptureReactivityKeyEnum } from '../enum/wallet-capture-reactivity-key.enum';
import { WalletCaptureReviewReasonEnum } from '../enum/wallet-capture-review-reason.enum';
import { WalletCaptureStatusEnum } from '../enum/wallet-capture-status.enum';

import { WalletCaptureNativeService } from './wallet-capture-native.service';
import { WalletCaptureTransactionService } from './wallet-capture-transaction.service';

import type { WalletCaptureNativeRecordInterface } from '../interface/wallet-capture-native-record.interface';
import type { WalletCaptureReviewItemInterface } from '../interface/wallet-capture-review-item.interface';
import type { Db, DbError } from '@budgie/contracts';

export class WalletCaptureImportService extends Context.Service<WalletCaptureImportService>()('@budgie/app/WalletCaptureImportService', {
    make: Effect.gen(function* () {
        const accountRepository = yield* AccountRepository;
        const transactionRepository = yield* TransactionRepository;
        const transactionService = yield* TransactionService;
        const nativeService = yield* WalletCaptureNativeService;
        const captureTransactionService = yield* WalletCaptureTransactionService;
        const lock = yield* Semaphore.make(1);
        const reactivity = yield* Reactivity.Reactivity;
        const duplicateWindowSeconds = 120;

        const resolveReviewItem = Effect.fnUntraced(function* (
            record: WalletCaptureNativeRecordInterface
        ): Effect.fn.Return<WalletCaptureReviewItemInterface | null, DbError, Db> {
            if (record.status === WalletCaptureStatusEnum.NEEDS_REVIEW) {
                return {
                    capture: record,
                    duplicateTransactionId: record.duplicateTransactionId,
                    reason: isDefined(record.duplicateTransactionId)
                        ? WalletCaptureReviewReasonEnum.DUPLICATE
                        : WalletCaptureReviewReasonEnum.INVALID_PAYLOAD
                };
            }

            const account = yield* accountRepository.findById(record.accountId);

            return !isDefined(account) || !account.isActive
                ? { capture: record, duplicateTransactionId: null, reason: WalletCaptureReviewReasonEnum.ACCOUNT_UNAVAILABLE }
                : null;
        });

        const createAndAcknowledgeCapture = Effect.fnUntraced(function* (record: WalletCaptureNativeRecordInterface) {
            yield* captureTransactionService.createCaptureTransaction(record);
            yield* nativeService.acknowledgeCaptures([record.captureId]);
        });

        const applyRulesAndAcknowledgeCapture = Effect.fnUntraced(function* (
            record: WalletCaptureNativeRecordInterface,
            transactionId: number
        ) {
            yield* captureTransactionService.applyRulesToExistingCaptureTransaction(record, transactionId);
            yield* nativeService.acknowledgeCaptures([record.captureId]);
        });

        const processCapture = Effect.fnUntraced(function* (record: WalletCaptureNativeRecordInterface, importedIds: Map<string, number>) {
            const importedTransactionId = importedIds.get(record.captureId);

            if (isDefined(importedTransactionId)) {
                yield* applyRulesAndAcknowledgeCapture(record, importedTransactionId);

                return null;
            }

            const reviewItem = yield* resolveReviewItem(record);

            if (isDefined(reviewItem)) {
                return reviewItem;
            }

            const duplicateTransactionId = yield* transactionRepository.findPotentialExpenseDuplicate({
                accountId: record.accountId,
                amountInMicroUnits: convertToMicroUnits(record.amount),
                normalizedTitle: record.merchant.trim().toLocaleLowerCase(),
                operatedAt: new Date(record.capturedAt),
                timeWindowSeconds: duplicateWindowSeconds
            });

            if (isDefined(duplicateTransactionId)) {
                yield* nativeService.markNeedsReview(record.captureId, duplicateTransactionId);

                return { capture: record, duplicateTransactionId, reason: WalletCaptureReviewReasonEnum.DUPLICATE };
            }

            yield* createAndAcknowledgeCapture(record);

            return null;
        });

        return {
            drain: Effect.fn('WalletCaptureImportService.drain')(
                function* () {
                    const records = yield* nativeService.getCaptures();
                    const importedIds = yield* transactionService.findIdMapByExternalSource(ExternalSourceEnum.APPLE_PAY_AUTOMATION);

                    const results = yield* Effect.forEach(records, record =>
                        Effect.gen(function* () {
                            const result = yield* Effect.exit(processCapture(record, importedIds));
                            if (Exit.isFailure(result) && Cause.hasInterrupts(result.cause)) {
                                return yield* Effect.failCause(result.cause);
                            }

                            yield* YIELD_TO_UI;

                            return result;
                        })
                    );
                    const failures = results.filter(Exit.isFailure);

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

                    if (!isDefined(record)) {
                        return;
                    }

                    const importedTransactionId = (yield* transactionService.findIdMapByExternalSource(
                        ExternalSourceEnum.APPLE_PAY_AUTOMATION
                    )).get(record.captureId);

                    if (isDefined(importedTransactionId)) {
                        yield* applyRulesAndAcknowledgeCapture(record, importedTransactionId);
                    } else {
                        yield* createAndAcknowledgeCapture(record);
                    }
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
            WalletCaptureNativeService.layer,
            WalletCaptureTransactionService.layer
        ])
    );
}
