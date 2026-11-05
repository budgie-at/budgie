import { format } from 'date-fns/format';
import * as DateTime from 'effect/DateTime';
import * as Effect from 'effect/Effect';
import { File, Paths } from 'expo-file-system';
import { isAvailableAsync, shareAsync } from 'expo-sharing';

import type { SharingOptions } from 'expo-sharing';

export const shareCacheFile = Effect.fn('shareCacheFile')(function* <Error, Requirements>(
    fileNamePrefix: string,
    extension: string,
    writeFile: (file: File) => Effect.Effect<void, Error, Requirements>,
    sharingOptions: Pick<SharingOptions, 'mimeType' | 'UTI'>
) {
    const now = yield* DateTime.nowAsDate;
    const fileName = `${fileNamePrefix}-${format(now, 'yyyy-MM-dd-HHmmss')}.${extension}`;
    const file = new File(Paths.cache, fileName);

    if (file.exists) {
        file.delete();
    }

    yield* writeFile(file);

    if (yield* Effect.promise(() => isAvailableAsync())) {
        yield* Effect.promise(() => shareAsync(file.uri, { ...sharingOptions, dialogTitle: fileName }));
    }
});
