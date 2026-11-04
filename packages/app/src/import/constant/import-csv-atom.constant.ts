import { countCsvRows, parseCsvHeaders, parseCsvSample } from '@budgie/import-export';
import * as Effect from 'effect/Effect';
import * as Atom from 'effect/reactivity/Atom';
import { File } from 'expo-file-system';

import { isDefined } from '@rnw-community/shared';

import { EMPTY_IMPORT_CSV } from './empty-import-csv.constant';

export const importCsvAtom = Atom.family((fileUri: string | null) =>
    Atom.make(
        isDefined(fileUri)
            ? Effect.gen(function* () {
                  const csvText = yield* Effect.promise(() => new File(fileUri).text());
                  const [headers, rowCount, samples] = yield* Effect.all([
                      parseCsvHeaders(csvText),
                      countCsvRows(csvText),
                      parseCsvSample(csvText)
                  ]);

                  return { csvText, headers, rowCount, samples };
              })
            : Effect.succeed(EMPTY_IMPORT_CSV)
    )
);
