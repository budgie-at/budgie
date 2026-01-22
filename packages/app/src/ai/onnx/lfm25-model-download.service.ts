/* eslint-disable no-console, max-statements, lingui/no-unlocalized-strings */
import { Directory, File, Paths } from 'expo-file-system';
import * as FileSystemLegacy from 'expo-file-system/legacy';

import { getErrorMessage, isDefined } from '@rnw-community/shared';

import { LFM25_DOWNLOAD_CONFIG, LFM25_MODEL_ID } from '../constant/onnx-llm.constant';

import { lfm25DownloadStorageService } from './lfm25-download-storage.service';

type ProgressCallback = (progress: number) => void;

interface DownloadFileOptionsInterface {
    url: string;
    cacheUri: string;
    finalUri: string;
    onProgress?: ProgressCallback;
    progressOffset?: number;
    progressWeight?: number;
}

class Lfm25ModelDownloadService {
    private currentDownload: FileSystemLegacy.DownloadResumable | null = null;

    async getModelPath(onProgress?: ProgressCallback): Promise<string> {
        if (this.isModelDownloaded()) {
            return this.getModelFile().uri;
        }

        return this.downloadModel(onProgress);
    }

    isModelDownloaded(): boolean {
        return this.getModelFile().exists && this.getModelDataFile().exists;
    }

    async downloadModel(onProgress?: ProgressCallback): Promise<string> {
        const modelFile = this.getModelFile();
        const modelDataFile = this.getModelDataFile();

        this.ensureDirectoryExists();

        const fileSizes = await this.getOrFetchFileSizes();
        const totalSize = fileSizes.modelFile + fileSizes.dataFile;
        const modelFileWeight = fileSizes.modelFile / totalSize;
        const dataFileWeight = fileSizes.dataFile / totalSize;

        onProgress?.(0);

        try {
            if (!modelFile.exists) {
                console.log(`Downloading LFM2.5 model file from: ${this.getModelUrl()}`);
                await this.downloadFile({
                    url: this.getModelUrl(),
                    cacheUri: this.getCacheUri(LFM25_DOWNLOAD_CONFIG.modelFilename),
                    finalUri: modelFile.uri,
                    onProgress,
                    progressOffset: 0,
                    progressWeight: modelFileWeight
                });
            }

            if (!modelDataFile.exists) {
                console.log(`Downloading LFM2.5 model data from: ${this.getModelDataUrl()}`);
                await this.downloadFile({
                    url: this.getModelDataUrl(),
                    cacheUri: this.getCacheUri(LFM25_DOWNLOAD_CONFIG.modelDataFilename),
                    finalUri: modelDataFile.uri,
                    onProgress,
                    progressOffset: modelFileWeight,
                    progressWeight: dataFileWeight
                });
            }

            console.log(`Model downloaded successfully to: ${modelFile.uri}`);
            onProgress?.(1);

            return modelFile.uri;
        } catch (err: unknown) {
            console.error(`Failed to download model: ${getErrorMessage(err)}`);
            throw err;
        }
    }

    async pauseDownload(): Promise<void> {
        if (!isDefined(this.currentDownload)) {
            return;
        }

        const pauseState = await this.currentDownload.pauseAsync();
        await lfm25DownloadStorageService.saveDownloadState({
            url: pauseState.url,
            fileUri: pauseState.fileUri,
            resumeData: pauseState.resumeData ?? ''
        });
        this.currentDownload = null;
    }

    async cancelDownload(): Promise<void> {
        if (isDefined(this.currentDownload)) {
            await this.currentDownload.cancelAsync();
            this.currentDownload = null;
        }
        await lfm25DownloadStorageService.clearDownloadState();
        await this.deletePartialFiles();
    }

    async deleteModel(): Promise<void> {
        const modelFile = this.getModelFile();
        const modelDataFile = this.getModelDataFile();

        if (modelFile.exists) {
            modelFile.delete();
        }

        if (modelDataFile.exists) {
            modelDataFile.delete();
        }

        await this.deletePartialFiles();
        await lfm25DownloadStorageService.clearDownloadState();
    }

    private async downloadFile(options: DownloadFileOptionsInterface): Promise<void> {
        const { url, cacheUri, finalUri, onProgress, progressOffset = 0, progressWeight = 1 } = options;

        const savedState = await lfm25DownloadStorageService.getDownloadState();
        const isResumingThisFile = isDefined(savedState) && savedState.url === url;

        const progressCallback = (downloadProgress: FileSystemLegacy.DownloadProgressData): void => {
            if (downloadProgress.totalBytesExpectedToWrite <= 0) {
                return;
            }

            const fileProgress = downloadProgress.totalBytesWritten / downloadProgress.totalBytesExpectedToWrite;
            const totalProgress = progressOffset + fileProgress * progressWeight;
            onProgress?.(totalProgress);
        };

        if (isResumingThisFile && isDefined(savedState.resumeData)) {
            console.log(`Resuming download for: ${url}`);
            this.currentDownload = new FileSystemLegacy.DownloadResumable(
                savedState.url,
                savedState.fileUri,
                {},
                progressCallback,
                savedState.resumeData
            );
            await this.currentDownload.resumeAsync();
        } else {
            this.currentDownload = FileSystemLegacy.createDownloadResumable(url, cacheUri, {}, progressCallback);
            await this.currentDownload.downloadAsync();
        }

        await lfm25DownloadStorageService.clearDownloadState();
        this.currentDownload = null;

        await FileSystemLegacy.moveAsync({ from: cacheUri, to: finalUri });
    }

    private async getOrFetchFileSizes(): Promise<{ modelFile: number; dataFile: number }> {
        const cached = await lfm25DownloadStorageService.getFileSizes();

        if (isDefined(cached)) {
            return { modelFile: cached.modelFile, dataFile: cached.dataFile };
        }

        const [modelSize, dataSize] = await Promise.all([
            this.fetchFileSize(this.getModelUrl()),
            this.fetchFileSize(this.getModelDataUrl())
        ]);

        await lfm25DownloadStorageService.saveFileSizes(modelSize, dataSize);

        return { modelFile: modelSize, dataFile: dataSize };
    }

    private async fetchFileSize(url: string): Promise<number> {
        const response = await fetch(url, { method: 'HEAD' });
        const contentLength = response.headers.get('content-length');

        return isDefined(contentLength) ? parseInt(contentLength, 10) : 0;
    }

    private ensureDirectoryExists(): void {
        const dir = new Directory(Paths.document, LFM25_DOWNLOAD_CONFIG.directory);

        if (!dir.exists) {
            dir.create();
        }

        const cacheDir = new Directory(Paths.cache, LFM25_DOWNLOAD_CONFIG.directory);

        if (!cacheDir.exists) {
            cacheDir.create();
        }
    }

    private async deletePartialFiles(): Promise<void> {
        const modelCacheUri = this.getCacheUri(LFM25_DOWNLOAD_CONFIG.modelFilename);
        const dataCacheUri = this.getCacheUri(LFM25_DOWNLOAD_CONFIG.modelDataFilename);

        await FileSystemLegacy.deleteAsync(modelCacheUri, { idempotent: true });
        await FileSystemLegacy.deleteAsync(dataCacheUri, { idempotent: true });
    }

    private getModelFile(): File {
        return new File(Paths.document, `${LFM25_DOWNLOAD_CONFIG.directory}/${LFM25_DOWNLOAD_CONFIG.modelFilename}`);
    }

    private getModelDataFile(): File {
        return new File(Paths.document, `${LFM25_DOWNLOAD_CONFIG.directory}/${LFM25_DOWNLOAD_CONFIG.modelDataFilename}`);
    }

    private getCacheUri(filename: string): string {
        return `${Paths.cache}${LFM25_DOWNLOAD_CONFIG.directory}/${filename}.partial`;
    }

    private getModelUrl(): string {
        return `${LFM25_DOWNLOAD_CONFIG.hfBaseUrl}/${LFM25_MODEL_ID}/resolve/main/onnx/${LFM25_DOWNLOAD_CONFIG.modelFilename}`;
    }

    private getModelDataUrl(): string {
        return `${LFM25_DOWNLOAD_CONFIG.hfBaseUrl}/${LFM25_MODEL_ID}/resolve/main/onnx/${LFM25_DOWNLOAD_CONFIG.modelDataFilename}`;
    }
}

export const lfm25ModelDownloadService = new Lfm25ModelDownloadService();
