/* eslint-disable no-console, no-await-in-loop, max-statements, n/no-unsupported-features/node-builtins, lingui/no-unlocalized-strings */
import { File, Paths } from 'expo-file-system';

import { getErrorMessage, isDefined } from '@rnw-community/shared';

import { LFM25_MODEL_ID, LFM25_MODEL_PATH } from '../constant/onnx-llm.constant';

type ProgressCallback = (progress: number) => void;

const MODEL_FILENAME = 'model_q4f16.onnx';
const HF_BASE_URL = 'https://huggingface.co';
const PROGRESS_COMPLETE = 100;

class Lfm25ModelDownloadService {
    private downloadPromise: Promise<string> | null = null;

    async getModelPath(): Promise<string> {
        const modelFile = this.getModelFile();

        if (modelFile.exists) {
            return modelFile.uri;
        }

        return this.downloadModel();
    }

    async downloadModel(onProgress?: ProgressCallback): Promise<string> {
        if (isDefined(this.downloadPromise)) {
            return this.downloadPromise;
        }

        this.downloadPromise = this.performDownload(onProgress);

        try {
            return await this.downloadPromise;
        } finally {
            this.downloadPromise = null;
        }
    }

    isModelDownloaded(): boolean {
        return this.getModelFile().exists;
    }

    async deleteModel(): Promise<void> {
        const modelFile = this.getModelFile();

        if (modelFile.exists) {
            modelFile.delete();
        }
    }

    private getModelFile(): File {
        return new File(Paths.document, LFM25_MODEL_PATH);
    }

    private getModelUrl(): string {
        return `${HF_BASE_URL}/${LFM25_MODEL_ID}/resolve/main/onnx/${MODEL_FILENAME}`;
    }

    private async performDownload(onProgress?: ProgressCallback): Promise<string> {
        const modelFile = this.getModelFile();
        const modelUrl = this.getModelUrl();

        console.log(`Downloading LFM2.5 model from: ${modelUrl}`);
        onProgress?.(0);

        try {
            const data = await this.fetchModelData(modelUrl, onProgress);
            this.writeModelFile(modelFile, data);

            console.log(`Model downloaded successfully to: ${modelFile.uri}`);
            onProgress?.(PROGRESS_COMPLETE);

            return modelFile.uri;
        } catch (err: unknown) {
            console.error(`Failed to download model: ${getErrorMessage(err)}`);
            throw err;
        }
    }

    private async fetchModelData(modelUrl: string, onProgress?: ProgressCallback): Promise<Uint8Array> {
        const response = await fetch(modelUrl);

        if (!response.ok) {
            throw new Error(`Failed to download model: ${response.status} ${response.statusText}`);
        }

        if (!isDefined(response.body)) {
            throw new Error('No response body');
        }

        const contentLength = response.headers.get('content-length');
        const totalBytes = isDefined(contentLength) ? parseInt(contentLength, 10) : 0;

        return this.readResponseStream(response.body, totalBytes, onProgress);
    }

    private async readResponseStream(
        body: ReadableStream<Uint8Array>,
        totalBytes: number,
        onProgress?: ProgressCallback
    ): Promise<Uint8Array> {
        const reader = body.getReader();
        const chunks: Uint8Array[] = [];
        let downloadedBytes = 0;
        let done = false;

        while (!done) {
            const { done: readDone, value } = await reader.read();
            done = readDone;

            if (isDefined(value)) {
                chunks.push(value);
                downloadedBytes += value.length;

                if (totalBytes > 0) {
                    const progress = Math.round((downloadedBytes / totalBytes) * PROGRESS_COMPLETE);
                    onProgress?.(progress);
                }
            }
        }

        return this.concatenateChunks(chunks);
    }

    private concatenateChunks(chunks: Uint8Array[]): Uint8Array {
        const totalLength = chunks.reduce((acc, chunk) => acc + chunk.length, 0);
        const result = new Uint8Array(totalLength);
        let offset = 0;

        for (const chunk of chunks) {
            result.set(chunk, offset);
            offset += chunk.length;
        }

        return result;
    }

    private writeModelFile(modelFile: File, data: Uint8Array): void {
        modelFile.create();
        modelFile.write(data);
    }
}

export const lfm25ModelDownloadService = new Lfm25ModelDownloadService();
