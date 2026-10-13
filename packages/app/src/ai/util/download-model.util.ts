import * as Effect from 'effect/Effect';
import * as Exit from 'effect/Exit';
import { File, Paths } from 'expo-file-system';

import { isDefined, isPositiveNumber } from '@rnw-community/shared';

import { downloadVerifiedFile } from '../utils/download-verified-file.util';

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
            for (const file of files) {
                if (file.exists) {
                    file.delete();
                }
            }
        });

    yield* deleteFiles(tempFile, sizeFile);

    const downloadExit = yield* Effect.exit(
        downloadVerifiedFile(url, tempFile, (bytesWritten, expectedBytes) => {
            onProgress(bytesWritten / expectedBytes);
        })
    );
    const downloadedBytes = Exit.isSuccess(downloadExit) ? downloadExit.value : null;

    if (!isDefined(downloadedBytes)) {
        yield* deleteFiles(tempFile);

        if (destFile.exists && isPositiveNumber(destFile.size)) {
            onProgress(1);

            return destFile.uri;
        }

        return yield* Effect.die(new Error('Model download failed'));
    }

    yield* deleteFiles(destFile);
    yield* Effect.promise(() => tempFile.move(destFile)).pipe(Effect.onError(() => deleteFiles(tempFile)));
    sizeFile.writeSync(String(downloadedBytes));

    return destFile.uri;
});
