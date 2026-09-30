import { t } from '@lingui/core/macro';
import * as Effect from 'effect/Effect';
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

class WhisperModelService {
    readonly download = Effect.fn('WhisperModelService.download')(function* (
        this: WhisperModelService,
        onProgress: (downloadProgress: number) => void
    ) {
        const { modelDirectory, modelFile, tempFile } = this.resolvePaths();

        if (!modelDirectory.exists) {
            modelDirectory.create({ idempotent: true, intermediates: true });
        }
        yield* this.migrateLegacyModelFile(modelFile);
        this.deleteFileIfExists(tempFile);

        if (!this.isExistingModelFile(modelFile)) {
            this.deleteFileIfExists(modelFile);
            yield* this.downloadToTempFile(tempFile, onProgress);
            yield* Effect.tryPromise(() => tempFile.move(modelFile));
        }
        onProgress(1);

        return modelFile.uri;
    });

    private readonly migrateLegacyModelFile = Effect.fnUntraced(function* (this: WhisperModelService, modelFile: File) {
        const legacyFile = new File(Paths.document, WHISPER_MODEL_FILENAME);

        if (this.isExistingModelFile(legacyFile) && !modelFile.exists) {
            yield* Effect.tryPromise(() => legacyFile.move(modelFile));
        }
    });

    private readonly downloadToTempFile = Effect.fnUntraced(function* (
        this: WhisperModelService,
        tempFile: File,
        onProgress: (downloadProgress: number) => void
    ) {
        let expectedBytes = 0;
        const download = createDownloadResumable(WHISPER_MODEL_URL, tempFile.uri, {}, progress => {
            expectedBytes = progress.totalBytesExpectedToWrite;
            onProgress(this.calculateProgress(progress.totalBytesWritten, expectedBytes));
        });
        const result = yield* Effect.tryPromise(() => download.downloadAsync());

        if (!isDefined(result?.uri) || !tempFile.exists || !isPositiveNumber(tempFile.size) || tempFile.size !== expectedBytes) {
            this.deleteFileIfExists(tempFile);
            yield* Effect.die(new Error(t`Whisper model download failed`));
        }
    });

    delete(): void {
        this.deleteFileIfExists(this.resolvePaths().modelFile);
    }

    private resolvePaths(): { readonly modelDirectory: Directory; readonly modelFile: File; readonly tempFile: File } {
        const modelDirectory = new Directory(Paths.document, WHISPER_MODEL_DIRECTORY);
        const modelFile = new File(modelDirectory, WHISPER_MODEL_FILENAME);
        const tempFile = new File(modelDirectory, WHISPER_MODEL_TEMP_FILENAME);

        return { modelDirectory, modelFile, tempFile };
    }

    private isExistingModelFile(file: File): boolean {
        return file.exists && isPositiveNumber(file.size);
    }

    private deleteFileIfExists(file: File): void {
        if (file.exists) {
            file.delete();
        }
    }

    private calculateProgress(bytesWritten: number, expectedBytes: number): number {
        if (!isPositiveNumber(expectedBytes)) {
            return 0;
        }

        return Math.min(WHISPER_MODEL_MAX_DOWNLOAD_PROGRESS, Math.max(0, bytesWritten / expectedBytes));
    }
}

export const whisperModelService = new WhisperModelService();
