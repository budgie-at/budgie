import { t } from '@lingui/core/macro';
import * as Context from 'effect/Context';
import * as Effect from 'effect/Effect';
import * as Layer from 'effect/Layer';
import { Directory, File, Paths } from 'expo-file-system';
import { createDownloadResumable } from 'expo-file-system/legacy';

import { isDefined, isPositiveNumber } from '@rnw-community/shared';

import {
    WHISPER_MODEL_DIRECTORY,
    WHISPER_MODEL_FILENAME,
    WHISPER_MODEL_MAX_DOWNLOAD_PROGRESS,
    WHISPER_MODEL_TEMP_FILENAME,
    WHISPER_MODEL_URL
} from '../constant/whisper-model.constant';

export class WhisperModelService extends Context.Service<WhisperModelService>()('@budgie/app/WhisperModelService', {
    make: Effect.sync(() => {
        const resolvePaths = () => {
            const modelDirectory = new Directory(Paths.document, WHISPER_MODEL_DIRECTORY);

            return {
                modelDirectory,
                modelFile: new File(modelDirectory, WHISPER_MODEL_FILENAME),
                tempFile: new File(modelDirectory, WHISPER_MODEL_TEMP_FILENAME)
            };
        };

        const isExistingModelFile = (file: File): boolean => file.exists && isPositiveNumber(file.size);

        const deleteFileIfExists = (file: File): void => {
            if (file.exists) {
                file.delete();
            }
        };

        const calculateProgress = (bytesWritten: number, expectedBytes: number): number => {
            if (!isPositiveNumber(expectedBytes)) {
                return 0;
            }

            return Math.min(WHISPER_MODEL_MAX_DOWNLOAD_PROGRESS, Math.max(0, bytesWritten / expectedBytes));
        };

        const migrateLegacyModelFile = Effect.fnUntraced(function* (modelFile: File) {
            const legacyFile = new File(Paths.document, WHISPER_MODEL_FILENAME);

            if (isExistingModelFile(legacyFile) && !modelFile.exists) {
                yield* Effect.tryPromise(() => legacyFile.move(modelFile));
            }
        });

        const downloadToTempFile = Effect.fnUntraced(function* (tempFile: File, onProgress: (downloadProgress: number) => void) {
            let expectedBytes = 0;
            const download = createDownloadResumable(WHISPER_MODEL_URL, tempFile.uri, {}, progress => {
                expectedBytes = progress.totalBytesExpectedToWrite;
                onProgress(calculateProgress(progress.totalBytesWritten, expectedBytes));
            });
            const result = yield* Effect.tryPromise(() => download.downloadAsync());

            if (!isDefined(result?.uri) || !tempFile.exists || !isPositiveNumber(tempFile.size) || tempFile.size !== expectedBytes) {
                deleteFileIfExists(tempFile);
                yield* Effect.die(new Error(t`Whisper model download failed`));
            }
        });

        return {
            download: Effect.fn('WhisperModelService.download')(function* (onProgress: (downloadProgress: number) => void) {
                const { modelDirectory, modelFile, tempFile } = resolvePaths();

                if (!modelDirectory.exists) {
                    modelDirectory.create({ idempotent: true, intermediates: true });
                }
                yield* migrateLegacyModelFile(modelFile);
                deleteFileIfExists(tempFile);

                if (!isExistingModelFile(modelFile)) {
                    deleteFileIfExists(modelFile);
                    yield* downloadToTempFile(tempFile, onProgress);
                    yield* Effect.tryPromise(() => tempFile.move(modelFile));
                }
                onProgress(1);

                return modelFile.uri;
            }),
            delete: (): void => {
                deleteFileIfExists(resolvePaths().modelFile);
            }
        };
    })
}) {
    static readonly layer = Layer.effect(WhisperModelService, WhisperModelService.make);
}
