import * as Effect from 'effect/Effect';
import { File, Paths } from 'expo-file-system';
import { createDownloadResumable } from 'expo-file-system/legacy';

import { isDefined, isPositiveNumber } from '@rnw-community/shared';

export const downloadModel = Effect.fn('downloadModel')(function* (
    url: string,
    filename: string,
    onProgress: (downloadProgress: number) => void
) {
    const destFile = new File(Paths.document, filename);
    const sizeFile = new File(Paths.document, `${filename}.size`);

    if (destFile.exists && sizeFile.exists && sizeFile.textSync() === String(destFile.size)) {
        onProgress(1);

        return destFile.uri;
    }

    const tempFile = new File(Paths.document, `${filename}.download`);
    const deleteFiles = (...files: File[]) =>
        Effect.sync(() => {
            files.filter(file => file.exists).forEach(file => file.delete());
        });
    let expectedBytes = 0;

    yield* deleteFiles(tempFile, destFile, sizeFile);

    yield* Effect.gen(function* () {
        const download = createDownloadResumable(url, tempFile.uri, {}, progress => {
            expectedBytes = progress.totalBytesExpectedToWrite;
            onProgress(progress.totalBytesWritten / progress.totalBytesExpectedToWrite);
        });
        const result = yield* Effect.promise(() => download.downloadAsync());

        if (!isDefined(result?.uri) || !tempFile.exists || !isPositiveNumber(tempFile.size) || tempFile.size !== expectedBytes) {
            return yield* Effect.die(new Error('Model download failed'));
        }

        yield* Effect.promise(() => tempFile.move(destFile));
        sizeFile.writeSync(String(expectedBytes));
    }).pipe(Effect.onError(() => deleteFiles(tempFile)));

    return destFile.uri;
});
