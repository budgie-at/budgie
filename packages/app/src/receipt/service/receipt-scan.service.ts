import { ReceiptMerchantLlmService } from '@budgie/ai';
import { EmbeddingSuggestionService } from '@budgie/categorization';
import { CategoryRepository, CurrencyEnum, LanguageEnum, SettingsRepository, convertFromMicroUnits } from '@budgie/contracts';
import { parseReceipt } from '@budgie/import-export';
import { ReceiptMatchService } from '@budgie/ledger';
import { SyncFileReader } from '@budgie/sync';
import * as Clock from 'effect/Clock';
import * as Context from 'effect/Context';
import * as Duration from 'effect/Duration';
import * as Effect from 'effect/Effect';
import * as Layer from 'effect/Layer';
import * as Option from 'effect/Option';
import * as Schema from 'effect/Schema';
import * as Semaphore from 'effect/Semaphore';
import { File } from 'expo-file-system';

import { isDefined, isNotEmptyArray, isNotEmptyString } from '@rnw-community/shared';

import { ReceiptScannerModule } from '../../../modules/receipt-scanner';
import { appAtomRegistry } from '../../@generic/constant/app-atom-registry.constant';
import { waitForIdle } from '../../@generic/utils/wait-for-idle.util';
import { AiSubsystemNameEnum } from '../../ai/enum/ai-subsystem-name.enum';
import { AiModelResidencyService } from '../../ai/service/ai-model-residency.service';
import { ChatService } from '../../ai/service/chat.service';
import { LocalEmbeddingService } from '../../ai/service/embedding.service';
import { receiptScanProgressAtom } from '../constant/receipt-scan-progress-atom.constant';
import { ReceiptScanFailureEnum } from '../enum/receipt-scan-failure.enum';

import type { ReceiptScanResultInterface } from '../interface/receipt-scan-result.interface';
import type { CategoryEntityInterface } from '@budgie/contracts';
import type { ReceiptDraftInterface, ReceiptTextLineInterface } from '@budgie/import-export';
import type { PdfTextItemInterface } from '@budgie/sync';

export class ReceiptScanService extends Context.Service<ReceiptScanService>()('@budgie/app/ReceiptScanService', {
    make: Effect.gen(function* () {
        const aiModelResidencyService = yield* AiModelResidencyService;
        const categoryRepository = yield* CategoryRepository;
        const embeddingSuggestionService = yield* EmbeddingSuggestionService;
        const receiptMatchService = yield* ReceiptMatchService;
        const receiptMerchantLlmService = yield* ReceiptMerchantLlmService;
        const settingsRepository = yield* SettingsRepository;
        const syncFileReader = yield* SyncFileReader;
        const nativeModule = ReceiptScannerModule;
        const processLock = yield* Semaphore.make(1);

        const AI_SUBSYSTEMS = [AiSubsystemNameEnum.CHAT, AiSubsystemNameEnum.EMBEDDING] as const;
        const PDF_PATTERN = /\.pdf$/iu;
        const PDF_PAGE_SPAN = 100_000;
        const CONTEXT_LINE_COUNT = 15;
        const decodeCurrency = Schema.decodeUnknownOption(Schema.Enum(CurrencyEnum));

        const failure = (kind: ReceiptScanFailureEnum): ReceiptScanResultInterface => ({
            kind,
            transactionId: null,
            title: '',
            fallback: null
        });

        const toTitleCase = (text: string): string =>
            text.toLocaleLowerCase().replaceAll(/(^|\s)\p{L}/gu, letter => letter.toLocaleUpperCase());

        const toPdfLines = (items: readonly PdfTextItemInterface[]): ReceiptTextLineInterface[] =>
            items.map(item => ({ text: item.text, x: item.x, y: item.page * PDF_PAGE_SPAN - item.y - item.height, height: item.height }));

        const toContext = (lines: readonly ReceiptTextLineInterface[]): string =>
            [...lines.slice(0, CONTEXT_LINE_COUNT), ...lines.slice(CONTEXT_LINE_COUNT).slice(-CONTEXT_LINE_COUNT)]
                .map(line => line.text)
                .join('\n');

        const readLines = (uri: string): Effect.Effect<readonly ReceiptTextLineInterface[]> => {
            if (PDF_PATTERN.test(uri)) {
                return Effect.map(syncFileReader.readPdfTextItems(uri), toPdfLines);
            }

            return isDefined(nativeModule) ? Effect.promise(() => nativeModule.recognize(uri)) : Effect.succeed([]);
        };

        const nameMerchant = (draft: ReceiptDraftInterface, lines: readonly ReceiptTextLineInterface[], isChatReady: boolean) => {
            const fallback = { title: toTitleCase(draft.merchantCandidates.at(0) ?? ''), description: null };

            if (!isChatReady) {
                return Effect.succeed(fallback);
            }

            return receiptMerchantLlmService.name([...draft.merchantCandidates, toContext(lines)].join('\n')).pipe(
                Effect.timeoutOption(Duration.seconds(8)),
                Effect.map(named =>
                    Option.match(Option.flatMap(named, Option.fromNullishOr), {
                        onNone: () => fallback,
                        onSome: ({ merchant, description }) => ({
                            title: isNotEmptyString(merchant.trim()) ? merchant.trim() : fallback.title,
                            description: isNotEmptyString(description.trim()) ? description.trim() : null
                        })
                    })
                ),
                Effect.orElseSucceed(() => fallback)
            );
        };

        const suggestCategoryId = (categories: CategoryEntityInterface[], title: string, description: string | null) =>
            embeddingSuggestionService.suggestCategories(categories, title, null, description ?? '', '', null).pipe(
                Effect.map(suggestions => suggestions.at(0)?.id ?? null),
                Effect.orElseSucceed(() => null)
            );

        const processReceipt = Effect.fnUntraced(function* (
            uri: string,
            isChatReady: boolean,
            categories: CategoryEntityInterface[],
            baseCurrency: CurrencyEnum
        ) {
            const lines = yield* readLines(uri);

            if (!isNotEmptyArray(lines)) {
                return failure(ReceiptScanFailureEnum.NO_TEXT);
            }

            const draft = parseReceipt(lines);

            if (!isDefined(draft)) {
                return { ...failure(ReceiptScanFailureEnum.MANUAL), fallback: { amount: null, aiContext: toContext(lines) } };
            }

            const { title, description } = yield* nameMerchant(draft, lines, isChatReady);
            const categoryId =
                isNotEmptyArray(categories) && isNotEmptyString(title) ? yield* suggestCategoryId(categories, title, description) : null;
            const now = yield* Clock.currentTimeMillis;

            return yield* receiptMatchService
                .match({
                    ...draft,
                    currency: draft.currency ?? baseCurrency,
                    occurredAt: draft.occurredAt ?? new Date(now),
                    title,
                    description,
                    categoryId
                })
                .pipe(
                    Effect.map((result): ReceiptScanResultInterface => ({ ...result, title, fallback: null })),
                    Effect.catchTags({
                        ReceiptAccountNotFoundError: () =>
                            Effect.succeed({
                                ...failure(ReceiptScanFailureEnum.MANUAL),
                                title,
                                fallback: { amount: convertFromMicroUnits(draft.total), aiContext: toContext(lines) }
                            })
                    })
                );
        });

        return {
            scan: () => (isDefined(nativeModule) ? Effect.promise(() => nativeModule.scan()) : Effect.succeed([])),
            process: Effect.fn('ReceiptScanService.process')(
                function* (uris: readonly string[]) {
                    const settings = yield* settingsRepository.findSettings();
                    const baseCurrency = Option.getOrElse(decodeCurrency(settings?.defaultInstrument?.code), () => CurrencyEnum.EUR);
                    const allCategories = yield* categoryRepository.findAllNonSystemLocalized(settings?.language ?? LanguageEnum.EN);

                    return yield* Effect.acquireUseRelease(
                        Effect.forEach(AI_SUBSYSTEMS, subsystem => aiModelResidencyService.acquire(subsystem)),
                        ([isChatReady, isEmbeddingReady]) =>
                            Effect.forEach(uris, (uri, index) =>
                                Effect.sync(
                                    () => void appAtomRegistry.set(receiptScanProgressAtom, { current: index + 1, total: uris.length })
                                ).pipe(
                                    Effect.andThen(processReceipt(uri, isChatReady, isEmbeddingReady ? allCategories : [], baseCurrency)),
                                    Effect.catchCause(cause => Effect.as(Effect.logError(cause), failure(ReceiptScanFailureEnum.FAILED))),
                                    Effect.ensuring(Effect.ignore(Effect.try(() => void new File(uri).delete()))),
                                    Effect.tap(() => waitForIdle)
                                )
                            ),
                        () => Effect.forEach(AI_SUBSYSTEMS, subsystem => aiModelResidencyService.release(subsystem), { discard: true })
                    );
                },
                effect => processLock.withPermit(effect)
            )
        };
    })
}) {
    static readonly layer = Layer.effect(ReceiptScanService, ReceiptScanService.make).pipe(
        Layer.provide([
            AiModelResidencyService.layer,
            CategoryRepository.layer,
            EmbeddingSuggestionService.layer.pipe(Layer.provide(LocalEmbeddingService.invokerLayer)),
            ReceiptMatchService.layer,
            ReceiptMerchantLlmService.layer.pipe(Layer.provide(ChatService.invokerLayer)),
            SettingsRepository.layer
        ])
    );
}
