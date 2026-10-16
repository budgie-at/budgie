import { EMBEDDING_MODEL_FILENAME } from '@budgie/categorization';
import { Db, SettingsRepository } from '@budgie/contracts';
import * as Context from 'effect/Context';
import * as Effect from 'effect/Effect';
import * as Layer from 'effect/Layer';
import { File, Paths } from 'expo-file-system';

import { isDefined } from '@rnw-community/shared';

import { appAtomRegistry } from '../../@generic/constant/app-atom-registry.constant';
import { NativeCallError } from '../../@generic/error/native-call.error';
import { isAiEnabled } from '../../@generic/utils/is-ai-enabled.util';
import { chatModelSnapshotAtom, embeddingModelSnapshotAtom, sttSnapshotAtom } from '../constant/ai-snapshot-atoms.constant';
import { WHISPER_MODEL_DIRECTORY, WHISPER_MODEL_FILENAME, WHISPER_MODEL_TEMP_FILENAME } from '../constant/whisper-model.constant';
import { AiSubsystemNameEnum } from '../enum/ai-subsystem-name.enum';
import { AiSubsystemStatusEnum } from '../enum/ai-subsystem-status.enum';
import { CHAT_MODEL_FILENAME } from '../utils/ai-constants.util';
import { getEnabledAiSubsystems } from '../utils/get-enabled-ai-subsystems.util';

export class AiModelStorageService extends Context.Service<AiModelStorageService>()('@budgie/app/AiModelStorageService', {
    make: Effect.gen(function* () {
        const settingsRepository = yield* SettingsRepository;
        const subsystemSnapshots = {
            [AiSubsystemNameEnum.CHAT]: chatModelSnapshotAtom,
            [AiSubsystemNameEnum.EMBEDDING]: embeddingModelSnapshotAtom,
            [AiSubsystemNameEnum.STT]: sttSnapshotAtom
        };
        const modelFiles = [
            { path: [CHAT_MODEL_FILENAME], subsystem: AiSubsystemNameEnum.CHAT },
            { path: [EMBEDDING_MODEL_FILENAME], subsystem: AiSubsystemNameEnum.EMBEDDING },
            { path: [WHISPER_MODEL_DIRECTORY, WHISPER_MODEL_FILENAME], subsystem: AiSubsystemNameEnum.STT },
            { path: [WHISPER_MODEL_DIRECTORY, WHISPER_MODEL_TEMP_FILENAME], subsystem: AiSubsystemNameEnum.STT },
            { path: [WHISPER_MODEL_FILENAME], subsystem: AiSubsystemNameEnum.STT },
            { path: ['nomic-embed-text-v2-moe.Q8_0.gguf'], subsystem: null },
            { path: ['qwen2.5-1.5b-instruct-q8_0.gguf'], subsystem: null }
        ];

        const isUnused = (subsystem: AiSubsystemNameEnum | null, enabled: ReadonlySet<AiSubsystemNameEnum>): boolean => {
            if (!isDefined(subsystem)) {
                return true;
            }
            const { status } = appAtomRegistry.get(subsystemSnapshots[subsystem]);

            return (
                !enabled.has(subsystem) &&
                (status === AiSubsystemStatusEnum.IDLE ||
                    status === AiSubsystemStatusEnum.SUSPENDED ||
                    status === AiSubsystemStatusEnum.DISABLED)
            );
        };

        const readFiles = () =>
            modelFiles
                .map(({ path, subsystem }) => ({ file: new File(Paths.document, ...path), subsystem }))
                .filter(({ file }) => file.exists);

        const enabledSubsystems = Effect.fnUntraced(function* () {
            const settings = yield* settingsRepository.getSettings();

            return isAiEnabled() ? getEnabledAiSubsystems(settings) : new Set<AiSubsystemNameEnum>();
        });

        return {
            getUsage: Effect.fn('AiModelStorageService.getUsage')(function* () {
                const enabled = yield* enabledSubsystems();

                return yield* Effect.try({
                    try: () =>
                        readFiles().reduce(
                            (usage, { file, subsystem }) => ({
                                totalBytes: usage.totalBytes + file.size,
                                unusedBytes: usage.unusedBytes + (isUnused(subsystem, enabled) ? file.size : 0)
                            }),
                            { totalBytes: 0, unusedBytes: 0 }
                        ),
                    catch: cause => new NativeCallError({ cause })
                });
            }),
            deleteUnused: Effect.fn('AiModelStorageService.deleteUnused')(function* () {
                yield* Db.transaction(
                    Effect.gen(function* () {
                        const enabled = yield* enabledSubsystems();

                        yield* Effect.try({
                            try: () => {
                                for (const { file, subsystem } of readFiles()) {
                                    if (isUnused(subsystem, enabled)) {
                                        file.delete();
                                    }
                                }
                            },
                            catch: cause => new NativeCallError({ cause })
                        });
                    })
                );
            })
        };
    })
}) {
    static readonly layer = Layer.effect(AiModelStorageService, AiModelStorageService.make).pipe(Layer.provide(SettingsRepository.layer));
}
