/* eslint-disable lingui/no-unlocalized-strings */
import * as SecureStore from 'expo-secure-store';

import { isDefined } from '@rnw-community/shared';

import { LFM25_DOWNLOAD_CONFIG } from '../constant/onnx-llm.constant';

interface DownloadStateInterface {
    url: string;
    fileUri: string;
    resumeData: string;
}

interface FileSizesInterface {
    modelFile: number;
    dataFile: number;
    timestamp: number;
}

const SIZE_CACHE_TTL_MS = 7 * 24 * 60 * 60 * 1000;

class Lfm25DownloadStorageService {
    async saveDownloadState(state: DownloadStateInterface): Promise<void> {
        await SecureStore.setItemAsync(LFM25_DOWNLOAD_CONFIG.storageKeys.downloadState, JSON.stringify(state));
    }

    async getDownloadState(): Promise<DownloadStateInterface | null> {
        const data = await SecureStore.getItemAsync(LFM25_DOWNLOAD_CONFIG.storageKeys.downloadState);

        if (!isDefined(data)) {
            return null;
        }

        return JSON.parse(data) as DownloadStateInterface;
    }

    async clearDownloadState(): Promise<void> {
        await SecureStore.deleteItemAsync(LFM25_DOWNLOAD_CONFIG.storageKeys.downloadState);
    }

    async saveFileSizes(modelFile: number, dataFile: number): Promise<void> {
        const sizes: FileSizesInterface = {
            modelFile,
            dataFile,
            timestamp: Date.now()
        };
        await SecureStore.setItemAsync(LFM25_DOWNLOAD_CONFIG.storageKeys.fileSizes, JSON.stringify(sizes));
    }

    async getFileSizes(): Promise<FileSizesInterface | null> {
        const data = await SecureStore.getItemAsync(LFM25_DOWNLOAD_CONFIG.storageKeys.fileSizes);

        if (!isDefined(data)) {
            return null;
        }

        const sizes = JSON.parse(data) as FileSizesInterface;
        const isExpired = Date.now() - sizes.timestamp > SIZE_CACHE_TTL_MS;

        if (isExpired) {
            await this.clearFileSizes();

            return null;
        }

        return sizes;
    }

    async clearFileSizes(): Promise<void> {
        await SecureStore.deleteItemAsync(LFM25_DOWNLOAD_CONFIG.storageKeys.fileSizes);
    }
}

export const lfm25DownloadStorageService = new Lfm25DownloadStorageService();
