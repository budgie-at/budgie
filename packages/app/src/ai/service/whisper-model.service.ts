import { Log } from '@budgie/logger';
import { t } from '@lingui/core/macro';
import { Directory, File, Paths } from 'expo-file-system';
import { createDownloadResumable } from 'expo-file-system/legacy';

import { getErrorMessage, isDefined, isPositiveNumber } from '@rnw-community/shared';

import {
    WHISPER_MODEL_DIRECTORY,
    WHISPER_MODEL_FILENAME,
    WHISPER_MODEL_MAX_DOWNLOAD_PROGRESS,
    WHISPER_MODEL_TEMP_FILENAME,
    WHISPER_MODEL_URL
} from '../constant/whisper-model.constant';

class WhisperModelService {
    @Log('enter', result => `done uri=${result}`, error => `throw error=${getErrorMessage(error)}`)
    async download(onProgress: (downloadProgress: number) => void): Promise<string> {
        const { modelDirectory, modelFile, tempFile } = this.resolvePaths();

        this.prepareFiles(modelDirectory, modelFile, tempFile);

        if (this.isExistingModelFile(modelFile)) {
            onProgress(1);

            return modelFile.uri;
        }

        this.deleteFileIfExists(modelFile);
        this.deleteFileIfExists(tempFile);
        await this.downloadToTempFile(tempFile, onProgress);
        tempFile.move(modelFile);
        onProgress(1);

        return modelFile.uri;
    }

    @Log('enter', 'done', error => `throw error=${getErrorMessage(error)}`)
    delete(): void {
        const { modelFile } = this.resolvePaths();
        this.deleteFileIfExists(modelFile);
    }

    private resolvePaths(): { readonly modelDirectory: Directory; readonly modelFile: File; readonly tempFile: File } {
        const modelDirectory = new Directory(Paths.document, WHISPER_MODEL_DIRECTORY);
        const modelFile = new File(modelDirectory, WHISPER_MODEL_FILENAME);
        const tempFile = new File(modelDirectory, WHISPER_MODEL_TEMP_FILENAME);

        return { modelDirectory, modelFile, tempFile };
    }

    private prepareFiles(modelDirectory: Directory, modelFile: File, tempFile: File): void {
        if (!modelDirectory.exists) {
            modelDirectory.create({ idempotent: true, intermediates: true });
        }
        this.migrateLegacyModelFile(modelFile);
        this.deleteFileIfExists(tempFile);
    }

    private migrateLegacyModelFile(modelFile: File): void {
        const legacyFile = new File(Paths.document, WHISPER_MODEL_FILENAME);

        if (!this.isExistingModelFile(legacyFile) || modelFile.exists) {
            return;
        }

        legacyFile.move(modelFile);
    }

    private isExistingModelFile(file: File): boolean {
        return file.exists && isPositiveNumber(file.size);
    }

    private deleteFileIfExists(file: File): void {
        if (file.exists) {
            file.delete();
        }
    }

    private async downloadToTempFile(tempFile: File, onProgress: (downloadProgress: number) => void): Promise<void> {
        let expectedBytes = 0;
        const download = createDownloadResumable(WHISPER_MODEL_URL, tempFile.uri, {}, progress => {
            expectedBytes = progress.totalBytesExpectedToWrite;
            onProgress(this.calculateProgress(progress.totalBytesWritten, expectedBytes));
        });
        const result = await download.downloadAsync();

        if (!isDefined(result?.uri) || !tempFile.exists || !isPositiveNumber(tempFile.size) || tempFile.size !== expectedBytes) {
            this.deleteFileIfExists(tempFile);
            throw new Error(t`Whisper model download failed`);
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
