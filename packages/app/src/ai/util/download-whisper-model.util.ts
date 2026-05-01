import { t } from '@lingui/core/macro';
import { Directory, File, Paths } from 'expo-file-system';
import { createDownloadResumable } from 'expo-file-system/legacy';

import { isDefined, isPositiveNumber } from '@rnw-community/shared';

import {
    WHISPER_MODEL_DIRECTORY,
    WHISPER_MODEL_FILENAME,
    WHISPER_MODEL_MAX_DOWNLOAD_PROGRESS,
    WHISPER_MODEL_SIZE_BYTES,
    WHISPER_MODEL_TEMP_FILENAME,
    WHISPER_MODEL_URL
} from '../constant/whisper-model.constant';

const isValidWhisperModelFile = (file: File): boolean => file.exists && file.size === WHISPER_MODEL_SIZE_BYTES;

const calculateWhisperDownloadProgress = (bytesWritten: number, expectedBytes: number): number => {
    const totalBytes = isPositiveNumber(expectedBytes) ? expectedBytes : WHISPER_MODEL_SIZE_BYTES;

    return Math.min(WHISPER_MODEL_MAX_DOWNLOAD_PROGRESS, Math.max(0, bytesWritten / totalBytes));
};

const ensureWhisperModelDirectory = (modelDirectory: Directory): void => {
    if (!modelDirectory.exists) {
        modelDirectory.create({ idempotent: true, intermediates: true });
    }
};

const deleteWhisperFileIfExists = (file: File): void => {
    if (file.exists) {
        file.delete();
    }
};

const migrateLegacyWhisperModel = (modelFile: File): void => {
    const legacyFile = new File(Paths.document, WHISPER_MODEL_FILENAME);

    if (!isValidWhisperModelFile(legacyFile) || modelFile.exists) {
        return;
    }

    legacyFile.move(modelFile);
};

const prepareWhisperModelFiles = (modelDirectory: Directory, modelFile: File, tempFile: File): void => {
    ensureWhisperModelDirectory(modelDirectory);
    migrateLegacyWhisperModel(modelFile);
    deleteWhisperFileIfExists(tempFile);
};

const deleteInvalidWhisperModelFiles = (modelFile: File, tempFile: File): void => {
    deleteWhisperFileIfExists(modelFile);
    deleteWhisperFileIfExists(tempFile);
};

const downloadWhisperModelToTempFile = async (tempFile: File, onDownloadProgress: (downloadProgress: number) => void): Promise<void> => {
    const download = createDownloadResumable(WHISPER_MODEL_URL, tempFile.uri, {}, progress => {
        onDownloadProgress(calculateWhisperDownloadProgress(progress.totalBytesWritten, progress.totalBytesExpectedToWrite));
    });
    const result = await download.downloadAsync();

    if (!isDefined(result?.uri) || !isValidWhisperModelFile(tempFile)) {
        deleteWhisperFileIfExists(tempFile);
        throw new Error(t`Whisper model download failed`);
    }
};

const moveWhisperModelToFinalPath = (tempFile: File, modelFile: File, onDownloadProgress: (downloadProgress: number) => void): string => {
    tempFile.move(modelFile);
    onDownloadProgress(1);

    return modelFile.uri;
};

export const downloadWhisperModel = async (onDownloadProgress: (downloadProgress: number) => void): Promise<string> => {
    const modelDirectory = new Directory(Paths.document, WHISPER_MODEL_DIRECTORY);
    const modelFile = new File(modelDirectory, WHISPER_MODEL_FILENAME);
    const tempFile = new File(modelDirectory, WHISPER_MODEL_TEMP_FILENAME);

    prepareWhisperModelFiles(modelDirectory, modelFile, tempFile);

    if (isValidWhisperModelFile(modelFile)) {
        onDownloadProgress(1);

        return modelFile.uri;
    }

    deleteInvalidWhisperModelFiles(modelFile, tempFile);
    await downloadWhisperModelToTempFile(tempFile, onDownloadProgress);

    return moveWhisperModelToFinalPath(tempFile, modelFile, onDownloadProgress);
};
