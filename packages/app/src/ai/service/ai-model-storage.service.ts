import { EMBEDDING_MODEL_FILENAME } from '@budgie/categorization';
import { SettingsRepository } from '@budgie/contracts';
import * as Context from 'effect/Context';
import * as Effect from 'effect/Effect';
import * as Layer from 'effect/Layer';
import { File, Paths } from 'expo-file-system';

import { isDefined } from '@rnw-community/shared';

import { appAtomRegistry } from '../../@generic/constant/app-atom-registry.constant';
import { NativeCallError } from '../../@generic/error/native-call.error';
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

        const isBusy = (subsystem: AiSubsystemNameEnum): boolean => {
            const { status } = appAtomRegistry.get(subsystemSnapshots[subsystem]);

            return status === AiSubsystemStatusEnum.DOWNLOADING || status === AiSubsystemStatusEnum.INITIALIZING;
        };

        const sumBytes = (files: readonly File[]): number => files.reduce((total, file) => total + file.size, 0);

        const readFiles = Effect.fnUntraced(function* () {
            const enabledSubsystems = getEnabledAiSubsystems(yield* settingsRepository.getSettings());

            return yield* Effect.try({
                try: () => {
                    const existing = modelFiles
                        .map(({ path, subsystem }) => ({ file: new File(Paths.document, ...path), subsystem }))
                        .filter(({ file }) => file.exists);

                    return {
                        all: existing.map(({ file }) => file),
                        unused: existing
                            .filter(({ subsystem }) => !isDefined(subsystem) || (!enabledSubsystems.has(subsystem) && !isBusy(subsystem)))
                            .map(({ file }) => file)
                    };
                },
                catch: cause => new NativeCallError({ cause })
            });
        });

        return {
            getUsage: Effect.fn('AiModelStorageService.getUsage')(function* () {
                const files = yield* readFiles();

                return { totalBytes: sumBytes(files.all), unusedBytes: sumBytes(files.unused) };
            }),
            deleteUnused: Effect.fn('AiModelStorageService.deleteUnused')(function* () {
                const files = yield* readFiles();

                yield* Effect.try({
                    try: () => {
                        files.unused.forEach(file => {
                            file.delete();
                        });
                    },
                    catch: cause => new NativeCallError({ cause })
                });
            })
        };
    })
}) {
    static readonly layer = Layer.effect(AiModelStorageService, AiModelStorageService.make).pipe(Layer.provide(SettingsRepository.layer));
}
