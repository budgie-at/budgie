import { SettingsRepository } from '@budgie/contracts';
import * as Context from 'effect/Context';
import * as Effect from 'effect/Effect';
import * as Layer from 'effect/Layer';
import * as Semaphore from 'effect/Semaphore';
import { File, Paths } from 'expo-file-system';

import { isDefined } from '@rnw-community/shared';

import { appAtomRegistry } from '../../@generic/constant/app-atom-registry.constant';
import { NativeCallError } from '../../@generic/error/native-call.error';
import { updateSettingsMutation } from '../../settings/mutation/update-settings.mutation';
import { AI_FEATURE_MODEL_STORAGE_IDS } from '../constant/ai-feature-model-storage-ids.constant';
import { AI_MODEL_STORAGE_FILES } from '../constant/ai-model-storage-files.constant';
import { chatModelSnapshotAtom, embeddingModelSnapshotAtom, sttSnapshotAtom } from '../constant/ai-snapshot-atoms.constant';
import { AiFeatureIdEnum } from '../enum/ai-feature-id.enum';
import { AiModelStorageIdEnum } from '../enum/ai-model-storage-id.enum';
import { AiSubsystemNameEnum } from '../enum/ai-subsystem-name.enum';
import { AiSubsystemStatusEnum } from '../enum/ai-subsystem-status.enum';
import { AiModelStorageBusyError } from '../error/ai-model-storage-busy.error';
import { AiModelStorageEntryInterface } from '../interface/ai-model-storage-entry.interface';
import { AiModelStorageFileInterface } from '../interface/ai-model-storage-file.interface';
import { getAiFeatureSettingsAfterChange } from '../utils/get-ai-feature-settings-after-change.util';
import { getEnabledAiFeatures } from '../utils/get-enabled-ai-features.util';

import { AiCoordinatorService } from './ai-coordinator.service';

import type { AiFeatureSettingsInterface } from '../interface/ai-feature-settings.interface';

export class AiModelStorageService extends Context.Service<AiModelStorageService>()('@budgie/app/AiModelStorageService', {
    make: Effect.gen(function* () {
        const aiCoordinatorService = yield* AiCoordinatorService;
        const settingsRepository = yield* SettingsRepository;
        const storageLock = yield* Semaphore.make(1);

        const statusBySubsystem: Record<AiSubsystemNameEnum, () => AiSubsystemStatusEnum> = {
            [AiSubsystemNameEnum.CHAT]: () => appAtomRegistry.get(chatModelSnapshotAtom).status,
            [AiSubsystemNameEnum.EMBEDDING]: () => appAtomRegistry.get(embeddingModelSnapshotAtom).status,
            [AiSubsystemNameEnum.STT]: () => appAtomRegistry.get(sttSnapshotAtom).status
        };

        const resolveFile = (storageFile: AiModelStorageFileInterface): File => new File(Paths.document, ...storageFile.path);

        const isBusy = (storageFile: AiModelStorageFileInterface): boolean => {
            if (!isDefined(storageFile.subsystem)) {
                return false;
            }
            const status = statusBySubsystem[storageFile.subsystem]();

            return status === AiSubsystemStatusEnum.DOWNLOADING || status === AiSubsystemStatusEnum.INITIALIZING;
        };

        const isCurrentStorageFile = (storageFile: AiModelStorageFileInterface): boolean => {
            if (storageFile.id !== AiModelStorageIdEnum.LEGACY_STT) {
                return storageFile.isCurrent;
            }

            return !AI_MODEL_STORAGE_FILES.some(knownStorageFile =>
                knownStorageFile.id === AiModelStorageIdEnum.STT ? resolveFile(knownStorageFile).exists : false
            );
        };

        const sumEntries = (entries: readonly AiModelStorageEntryInterface[]): number =>
            entries.reduce((totalBytes, entry) => totalBytes + entry.bytes, 0);

        const readFeatureSettings = Effect.fnUntraced(function* () {
            const settings = yield* settingsRepository.getSettings();

            return {
                isAiVoiceInputEnabled: settings.isAiEnabled && settings.isAiVoiceInputEnabled,
                isAiSuggestionsEnabled: settings.isAiEnabled && settings.isAiSuggestionsEnabled,
                isAiTranslationsEnabled: settings.isAiEnabled && settings.isAiTranslationsEnabled
            };
        });

        const readEntry = Effect.fnUntraced(function* (
            storageFile: AiModelStorageFileInterface
        ): Effect.fn.Return<AiModelStorageEntryInterface | null, NativeCallError> {
            const file = resolveFile(storageFile);
            const result = yield* Effect.try({
                try: () => ({ exists: file.exists, bytes: file.exists ? file.size : 0 }),
                catch: cause => new NativeCallError({ cause })
            });

            return result.exists
                ? {
                      id: storageFile.id,
                      bytes: result.bytes,
                      isCurrent: isCurrentStorageFile(storageFile),
                      isBusy: isBusy(storageFile)
                  }
                : null;
        });

        const getNeededStorageIds = (
            entries: readonly AiModelStorageEntryInterface[],
            featureSettings: AiFeatureSettingsInterface
        ): ReadonlySet<AiModelStorageIdEnum> => {
            const storageIds = new Set(getEnabledAiFeatures(featureSettings).flatMap(featureId => AI_FEATURE_MODEL_STORAGE_IDS[featureId]));
            const legacySttEntry = entries.find(entry => entry.id === AiModelStorageIdEnum.LEGACY_STT);

            if (featureSettings.isAiVoiceInputEnabled && legacySttEntry?.isCurrent) {
                storageIds.add(AiModelStorageIdEnum.LEGACY_STT);
            }

            return storageIds;
        };

        const getFeatureStorageIds = (
            entries: readonly AiModelStorageEntryInterface[],
            featureId: AiFeatureIdEnum
        ): ReadonlySet<AiModelStorageIdEnum> => {
            const storageIds = new Set(AI_FEATURE_MODEL_STORAGE_IDS[featureId]);
            const legacySttEntry = entries.find(entry => entry.id === AiModelStorageIdEnum.LEGACY_STT);

            if (featureId === AiFeatureIdEnum.VOICE_INPUT && legacySttEntry?.isCurrent) {
                storageIds.add(AiModelStorageIdEnum.LEGACY_STT);
            }

            return storageIds;
        };

        const findUnusedEntries = (
            entries: readonly AiModelStorageEntryInterface[],
            featureSettings: AiFeatureSettingsInterface
        ): readonly AiModelStorageEntryInterface[] => {
            const neededStorageIds = getNeededStorageIds(entries, featureSettings);

            return entries.filter(entry => !entry.isBusy && (!entry.isCurrent || !neededStorageIds.has(entry.id)));
        };

        const list = Effect.fn('AiModelStorageService.list')(function* () {
            const entries = yield* Effect.forEach(AI_MODEL_STORAGE_FILES, readEntry);
            const existingEntries = entries.filter(isDefined);
            const featureSettings = yield* readFeatureSettings();
            const unusedEntries = findUnusedEntries(existingEntries, featureSettings);

            return {
                features: Object.values(AiFeatureIdEnum).map(featureId => ({
                    id: featureId,
                    isEnabled: getEnabledAiFeatures(featureSettings).includes(featureId),
                    requiredBytes: sumEntries(
                        existingEntries.filter(entry => getFeatureStorageIds(existingEntries, featureId).has(entry.id) && entry.isCurrent)
                    ),
                    reclaimableBytesAfterDisable: sumEntries(
                        findUnusedEntries(existingEntries, getAiFeatureSettingsAfterChange(featureSettings, featureId, false))
                    )
                })),
                entries: existingEntries,
                unusedBytes: sumEntries(unusedEntries),
                totalBytes: sumEntries(existingEntries)
            };
        });

        const previewDisableFeature = Effect.fn('AiModelStorageService.previewDisableFeature')(function* (featureId: AiFeatureIdEnum) {
            const snapshot = yield* list();
            const featureSettings = yield* readFeatureSettings();
            const nextFeatureSettings = getAiFeatureSettingsAfterChange(featureSettings, featureId, false);
            const neededStorageIds = getNeededStorageIds(snapshot.entries, featureSettings);
            const nextNeededStorageIds = getNeededStorageIds(snapshot.entries, nextFeatureSettings);

            return {
                featureId,
                reclaimableBytes: sumEntries(findUnusedEntries(snapshot.entries, nextFeatureSettings)),
                keepsSharedDownloads: snapshot.entries.some(
                    entry => entry.isCurrent && neededStorageIds.has(entry.id) && nextNeededStorageIds.has(entry.id)
                )
            };
        });

        const deleteStorageFile = Effect.fnUntraced(function* (storageFile: AiModelStorageFileInterface) {
            const file = resolveFile(storageFile);

            yield* Effect.try({
                try: () => {
                    if (file.exists) {
                        file.delete();
                    }
                },
                catch: cause => new NativeCallError({ cause })
            });
        });

        const readUnusedStorageFiles = Effect.fnUntraced(function* () {
            const snapshot = yield* list();
            const featureSettings = yield* readFeatureSettings();
            const unusedEntries = findUnusedEntries(snapshot.entries, featureSettings);

            return AI_MODEL_STORAGE_FILES.filter(storageFile => unusedEntries.some(entry => entry.id === storageFile.id));
        });

        const deleteUnusedStorageFiles = Effect.fnUntraced(function* () {
            const storageFiles = yield* readUnusedStorageFiles();

            if (storageFiles.some(isBusy)) {
                return yield* new AiModelStorageBusyError();
            }
            yield* Effect.forEach(storageFiles, deleteStorageFile, { discard: true });
        });

        const updateFeature = Effect.fnUntraced(function* (featureId: AiFeatureIdEnum, isEnabled: boolean, removeUnusedDownloads: boolean) {
            const currentFeatureSettings = yield* readFeatureSettings();
            const nextFeatureSettings = getAiFeatureSettingsAfterChange(currentFeatureSettings, featureId, isEnabled);

            yield* updateSettingsMutation({
                ...nextFeatureSettings,
                isAiEnabled: Object.values(nextFeatureSettings).some(Boolean)
            });
            yield* aiCoordinatorService.withStoppedRuntime(removeUnusedDownloads ? deleteUnusedStorageFiles() : Effect.void);
        });

        return {
            list,
            previewDisableFeature,
            setFeatureEnabled: Effect.fn('AiModelStorageService.setFeatureEnabled')(function* (
                featureId: AiFeatureIdEnum,
                isEnabled: boolean,
                removeUnusedDownloads: boolean
            ) {
                yield* storageLock.withPermit(updateFeature(featureId, isEnabled, removeUnusedDownloads));

                return yield* list();
            }),
            freeUnusedDownloads: Effect.fn('AiModelStorageService.freeUnusedDownloads')(function* () {
                yield* storageLock.withPermit(aiCoordinatorService.withStoppedRuntime(deleteUnusedStorageFiles()));

                return yield* list();
            })
        };
    })
}) {
    static readonly layer = Layer.effect(AiModelStorageService, AiModelStorageService.make).pipe(
        Layer.provide([AiCoordinatorService.layer, SettingsRepository.layer])
    );
}
