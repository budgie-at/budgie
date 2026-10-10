import { SettingsRepository } from '@budgie/contracts';
import * as Context from 'effect/Context';
import * as Effect from 'effect/Effect';
import * as Fiber from 'effect/Fiber';
import * as Layer from 'effect/Layer';
import * as Semaphore from 'effect/Semaphore';
import { File, Paths } from 'expo-file-system';

import { isDefined } from '@rnw-community/shared';

import { appAtomRegistry } from '../../@generic/constant/app-atom-registry.constant';
import { NativeCallError } from '../../@generic/error/native-call.error';
import { updateSettingsMutation } from '../../settings/mutation/update-settings.mutation';
import { AI_MODEL_STORAGE_FILES } from '../constant/ai-model-storage-files.constant';
import {
    aiCoordinatorSnapshotAtom,
    chatModelSnapshotAtom,
    embeddingModelSnapshotAtom,
    sttSnapshotAtom
} from '../constant/ai-snapshot-atoms.constant';
import { AiModelStorageIdEnum } from '../enum/ai-model-storage-id.enum';
import { AiSubsystemNameEnum } from '../enum/ai-subsystem-name.enum';
import { AiSubsystemStatusEnum } from '../enum/ai-subsystem-status.enum';
import { AiModelStorageBusyError } from '../error/ai-model-storage-busy.error';
import { AiModelStorageEnabledError } from '../error/ai-model-storage-enabled.error';
import { AiModelStorageEntryInterface } from '../interface/ai-model-storage-entry.interface';
import { AiModelStorageFileInterface } from '../interface/ai-model-storage-file.interface';

import { AiCoordinatorService } from './ai-coordinator.service';

import type { AiModelStorageSnapshotInterface } from '../interface/ai-model-storage-snapshot.interface';

export class AiModelStorageService extends Context.Service<AiModelStorageService>()('@budgie/app/AiModelStorageService', {
    make: Effect.gen(function* () {
        const aiCoordinatorService = yield* AiCoordinatorService;
        const settingsRepository = yield* SettingsRepository;
        const removalLock = yield* Semaphore.make(1);
        const shutdownTimeoutMs = 15_000;

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

        const isCurrentSubsystemBusy = (): boolean =>
            Object.values(AiSubsystemNameEnum).some(subsystem => {
                const status = statusBySubsystem[subsystem]();

                return status === AiSubsystemStatusEnum.DOWNLOADING || status === AiSubsystemStatusEnum.INITIALIZING;
            });

        const isCurrentStorageFile = (storageFile: AiModelStorageFileInterface): boolean => {
            if (storageFile.id !== AiModelStorageIdEnum.LEGACY_STT) {
                return storageFile.isCurrent;
            }

            return !AI_MODEL_STORAGE_FILES.some(knownStorageFile =>
                knownStorageFile.id === AiModelStorageIdEnum.STT ? resolveFile(knownStorageFile).exists : false
            );
        };

        const waitForShutdown = Effect.fnUntraced(function* () {
            const fiber = yield* aiCoordinatorService.stopAndWait().pipe(Effect.forkDetach);

            yield* Fiber.join(fiber).pipe(Effect.timeout(shutdownTimeoutMs));
        });

        const ensureAiStillStopped = Effect.fnUntraced(function* () {
            const settings = yield* settingsRepository.findSettings();
            const coordinatorSnapshot = appAtomRegistry.get(aiCoordinatorSnapshotAtom);

            if (settings?.isAiEnabled || isCurrentSubsystemBusy() || !coordinatorSnapshot.isSuspended) {
                return yield* new AiModelStorageEnabledError();
            }
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

        const list = Effect.fn('AiModelStorageService.list')(function* (): Effect.fn.Return<
            AiModelStorageSnapshotInterface,
            NativeCallError
        > {
            const entries = yield* Effect.forEach(AI_MODEL_STORAGE_FILES, readEntry);
            const existingEntries = entries.filter(isDefined);

            return {
                entries: existingEntries,
                totalBytes: existingEntries.reduce((totalBytes, entry) => totalBytes + entry.bytes, 0)
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

        const removeStorageFiles = Effect.fnUntraced(function* (storageFiles: readonly AiModelStorageFileInterface[]) {
            if (storageFiles.some(isBusy)) {
                return yield* new AiModelStorageBusyError();
            }
            if (storageFiles.some(isCurrentStorageFile)) {
                if (isCurrentSubsystemBusy()) {
                    return yield* new AiModelStorageBusyError();
                }
                yield* updateSettingsMutation({ isAiEnabled: false });
                yield* waitForShutdown();
                yield* ensureAiStillStopped();
            }
            yield* Effect.forEach(storageFiles, deleteStorageFile, { discard: true });
        });

        return {
            list,
            remove: Effect.fn('AiModelStorageService.remove')(function* (id: AiModelStorageIdEnum) {
                yield* removalLock.withPermit(
                    Effect.gen(function* () {
                        const storageFile = AI_MODEL_STORAGE_FILES.find(file => file.id === id);

                        if (isDefined(storageFile)) {
                            yield* removeStorageFiles([storageFile]);
                        }
                    })
                );

                return yield* list();
            }),
            removeAll: Effect.fn('AiModelStorageService.removeAll')(function* () {
                yield* removalLock.withPermit(
                    Effect.gen(function* () {
                        const snapshot = yield* list();
                        const installedStorageFiles = AI_MODEL_STORAGE_FILES.filter(storageFile =>
                            snapshot.entries.some(entry => entry.id === storageFile.id)
                        );
                        yield* removeStorageFiles(installedStorageFiles);
                    })
                );

                return yield* list();
            })
        };
    })
}) {
    static readonly layer = Layer.effect(AiModelStorageService, AiModelStorageService.make).pipe(
        Layer.provide([AiCoordinatorService.layer, SettingsRepository.layer])
    );
}
