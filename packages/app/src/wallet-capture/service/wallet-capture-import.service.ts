import { buildConsolidationScopeFromTransactions } from '@budgie/consolidation';
import {
    AccountRepository,
    AccountTypeEnum,
    ExternalSourceEnum,
    SettingsRepository,
    TransactionRepository,
    YIELD_TO_UI,
    convertToMicroUnits
} from '@budgie/contracts';
import { TransactionService } from '@budgie/ledger';
import { TransferConsolidationDrainerService } from '@budgie/sync';
import * as Cause from 'effect/Cause';
import * as Context from 'effect/Context';
import * as DateTime from 'effect/DateTime';
import * as Effect from 'effect/Effect';
import * as Exit from 'effect/Exit';
import * as Layer from 'effect/Layer';
import * as Reactivity from 'effect/reactivity/Reactivity';
import * as Semaphore from 'effect/Semaphore';

import { isDefined, isNotEmptyArray, isNotEmptyString } from '@rnw-community/shared';

import { WalletCaptureReactivityKeyEnum } from '../enum/wallet-capture-reactivity-key.enum';
import { WalletCaptureReviewReasonEnum } from '../enum/wallet-capture-review-reason.enum';

import { WalletCaptureNativeService } from './wallet-capture-native.service';
import { WalletCaptureTransactionService } from './wallet-capture-transaction.service';

import type { WalletCaptureNativeRecordInterface } from '../interface/wallet-capture-native-record.interface';
import type { WalletCaptureRecordInterface } from '../interface/wallet-capture-record.interface';
import type { WalletCaptureReviewItemInterface } from '../interface/wallet-capture-review-item.interface';
import type { AccountEntityInterface, Db, DbError, TransactionEntityInterface } from '@budgie/contracts';

export class WalletCaptureImportService extends Context.Service<WalletCaptureImportService>()('@budgie/app/WalletCaptureImportService', {
    make: Effect.gen(function* () {
        const accountRepository = yield* AccountRepository;
        const settingsRepository = yield* SettingsRepository;
        const transactionRepository = yield* TransactionRepository;
        const transactionService = yield* TransactionService;
        const nativeService = yield* WalletCaptureNativeService;
        const captureTransactionService = yield* WalletCaptureTransactionService;
        const transferConsolidationDrainerService = yield* TransferConsolidationDrainerService;
        const lock = yield* Semaphore.make(1);
        const reactivity = yield* Reactivity.Reactivity;
        const duplicateWindowSeconds = 120;

        const tokenize = (value: string) =>
            value
                .normalize('NFKD')
                .replaceAll(/\p{Diacritic}/gu, '')
                .toLocaleLowerCase()
                .split(/[^\p{L}\p{N}]+/u)
                .filter(isNotEmptyString);

        const isCardDigits = (word: string) => /^\d{4}$/u.test(word);

        const pickMostSpecific = (matches: readonly { readonly id: number; readonly words: readonly string[] }[]) => {
            const bestWordCount = Math.max(0, ...matches.map(match => match.words.length));
            const bestMatches = matches.filter(match => match.words.length === bestWordCount);

            return bestMatches.length === 1 ? bestMatches[0]?.id : null;
        };

        const findAccountIdByCardName = (cardName: string | null, accounts: readonly Pick<AccountEntityInterface, 'id' | 'title'>[]) => {
            const cardWords = tokenize(cardName ?? '');
            const hasCardDigits = cardWords.some(isCardDigits);
            const titles = accounts.map(account => ({ id: account.id, words: tokenize(account.title) }));
            const digitMatches = titles.filter(title => title.words.some(word => isCardDigits(word) && cardWords.includes(word)));
            const nameMatches = titles
                .filter(title => !hasCardDigits || !title.words.some(isCardDigits))
                .map(title => ({ id: title.id, words: title.words.filter(word => !isCardDigits(word)) }))
                .filter(title => isNotEmptyArray(title.words));

            return (
                (digitMatches.length === 1 ? digitMatches[0]?.id : null) ??
                pickMostSpecific(nameMatches.filter(title => title.words.every(word => cardWords.includes(word)))) ??
                pickMostSpecific(
                    nameMatches.filter(
                        title => isNotEmptyArray(cardWords) && cardWords.every(word => isCardDigits(word) || title.words.includes(word))
                    )
                )
            );
        };

        const resolveRecord = Effect.fnUntraced(function* (
            record: WalletCaptureNativeRecordInterface
        ): Effect.fn.Return<WalletCaptureRecordInterface | null, DbError, Db> {
            if (isDefined(record.accountId)) {
                const account = yield* accountRepository.findById(record.accountId);

                return isDefined(account) && account.isActive ? { ...record, accountId: account.id } : null;
            }

            const candidates = (yield* accountRepository.getAllActiveAccounts).filter(account => account.type !== AccountTypeEnum.DEBT);
            const { defaultAccountId } = yield* settingsRepository.getSettings();
            const accountId =
                findAccountIdByCardName(record.cardName, candidates) ??
                candidates.find(account => account.id === defaultAccountId)?.id ??
                (candidates.length === 1 ? candidates[0]?.id : null);

            return isDefined(accountId) ? { ...record, accountId } : null;
        });

        const resolveReviewItem = Effect.fnUntraced(function* (
            record: WalletCaptureRecordInterface
        ): Effect.fn.Return<WalletCaptureReviewItemInterface | null, DbError, Db> {
            const accountAmount = yield* captureTransactionService.resolveAccountAmount(record);

            if (!isDefined(accountAmount)) {
                return { capture: record, duplicateTransactionId: null, reason: WalletCaptureReviewReasonEnum.CURRENCY_UNAVAILABLE };
            }

            const duplicateTransactionId = yield* transactionRepository.findPotentialExpenseDuplicate({
                accountId: record.accountId,
                amountInMicroUnits: convertToMicroUnits(accountAmount.amount),
                normalizedTitle: record.merchant.trim().toLocaleLowerCase(),
                operatedAt: DateTime.toDateUtc(DateTime.makeUnsafe(record.capturedAt)),
                timeWindowSeconds: duplicateWindowSeconds
            });

            return isDefined(duplicateTransactionId)
                ? { capture: record, duplicateTransactionId, reason: WalletCaptureReviewReasonEnum.DUPLICATE }
                : null;
        });

        const unavailableAccountItem = (record: WalletCaptureNativeRecordInterface): WalletCaptureReviewItemInterface => ({
            capture: record,
            duplicateTransactionId: null,
            reason: WalletCaptureReviewReasonEnum.ACCOUNT_UNAVAILABLE
        });

        const inspectCapture = Effect.fnUntraced(function* (nativeRecord: WalletCaptureNativeRecordInterface) {
            const record = yield* resolveRecord(nativeRecord);

            return isDefined(record)
                ? { record, reviewItem: yield* resolveReviewItem(record) }
                : { record, reviewItem: unavailableAccountItem(nativeRecord) };
        });

        const findImportedIds = () => transactionService.findIdMapByExternalSource(ExternalSourceEnum.APPLE_PAY_AUTOMATION);

        const importAndAcknowledgeCapture = Effect.fnUntraced(function* (
            record: WalletCaptureRecordInterface,
            importedTransactionId: number | undefined
        ) {
            const transactionId = isDefined(importedTransactionId)
                ? yield* captureTransactionService
                      .applyRulesToExistingCaptureTransaction(record, importedTransactionId)
                      .pipe(Effect.as(importedTransactionId))
                : yield* captureTransactionService.createCaptureTransaction(record);
            yield* nativeService.acknowledgeCaptures([record.captureId]);

            return { id: transactionId, operatedAt: DateTime.toDateUtc(DateTime.makeUnsafe(record.capturedAt)) };
        });

        const enqueueConsolidation = (importedCaptures: readonly Pick<TransactionEntityInterface, 'id' | 'operatedAt'>[]) => {
            const scope = buildConsolidationScopeFromTransactions([...importedCaptures]);

            return isDefined(scope) ? transferConsolidationDrainerService.enqueue(scope) : Effect.void;
        };

        const processCapture = Effect.fnUntraced(function* (
            nativeRecord: WalletCaptureNativeRecordInterface,
            importedIds: Map<string, number>,
            importedCaptures: Pick<TransactionEntityInterface, 'id' | 'operatedAt'>[]
        ) {
            const importedTransactionId = importedIds.get(nativeRecord.captureId);
            const record = yield* resolveRecord(nativeRecord);

            if (!isDefined(record)) {
                if (isDefined(importedTransactionId)) {
                    yield* nativeService.acknowledgeCaptures([nativeRecord.captureId]);

                    return null;
                }

                return unavailableAccountItem(nativeRecord);
            }

            if (!isDefined(importedTransactionId)) {
                const reviewItem = yield* resolveReviewItem(record);

                if (isDefined(reviewItem)) {
                    return reviewItem;
                }
            }

            const importedCapture = yield* importAndAcknowledgeCapture(record, importedTransactionId);
            importedCaptures.push(importedCapture);

            return null;
        });

        return {
            drain: Effect.fn('WalletCaptureImportService.drain')(
                function* () {
                    const records = yield* nativeService.getCaptures();
                    const importedIds = yield* findImportedIds();
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
                    const nativeRecord = (yield* nativeService.getCaptures()).find(capture => capture.captureId === captureId);

                    if (!isDefined(nativeRecord)) {
                        return;
                    }

                    const { record, reviewItem } = yield* inspectCapture(nativeRecord);

                    if (!isDefined(record) || reviewItem?.reason !== WalletCaptureReviewReasonEnum.DUPLICATE) {
                        return;
                    }

                    yield* enqueueConsolidation([
                        yield* importAndAcknowledgeCapture(record, (yield* findImportedIds()).get(record.captureId))
                    ]);
                },
                effect => lock.withPermit(effect)
            ),
            dismiss: Effect.fn('WalletCaptureImportService.dismiss')(
                function* (captureId: string) {
                    const record = (yield* nativeService.getCaptures()).find(capture => capture.captureId === captureId);

                    if (isDefined(record) && isDefined((yield* inspectCapture(record)).reviewItem)) {
                        yield* nativeService.acknowledgeCaptures([record.captureId]);
                    }
                },
                effect => lock.withPermit(effect)
            ),
            getReviewItems: Effect.fn('WalletCaptureImportService.getReviewItems')(function* () {
                const importedIds = yield* findImportedIds();
                const records = (yield* nativeService.getCaptures()).filter(record => !importedIds.has(record.captureId));

                return (yield* Effect.forEach(records, record => inspectCapture(record)))
                    .map(({ reviewItem }) => reviewItem)
                    .filter(isDefined);
            })
        };
    })
}) {
    static readonly layer = Layer.effect(WalletCaptureImportService, WalletCaptureImportService.make).pipe(
        Layer.provide([
            AccountRepository.layer,
            SettingsRepository.layer,
            TransactionRepository.layer,
            TransactionService.layer,
            WalletCaptureNativeService.layer,
            WalletCaptureTransactionService.layer
        ])
    );
}
