import { countCsvRows, parseCsvHeaders } from '@budgie/import-export';
import { t } from '@lingui/core/macro';
import * as Cause from 'effect/Cause';
import * as Effect from 'effect/Effect';
import * as Atom from 'effect/reactivity/Atom';
import { File } from 'expo-file-system';
import { router } from 'expo-router';

import { getErrorMessage, isDefined } from '@rnw-community/shared';

import { showErrorToast } from '../../@generic/utils/show-error-toast/show-error-toast';

import { EMPTY_IMPORT_CSV } from './empty-import-csv.constant';

import type { ImportCsvInterface } from '../interface/import-csv.interface';

export const importCsvAtom = Atom.family((fileUri: string | null) =>
    Atom.make(
        isDefined(fileUri)
            ? Effect.gen(function* () {
                  const csvText = yield* Effect.promise(() => new File(fileUri).text());
                  const [headers, rowCount] = yield* Effect.all([parseCsvHeaders(csvText), countCsvRows(csvText)]);
                  const importCsv: ImportCsvInterface = { csvText, headers, rowCount };

                  return importCsv;
              }).pipe(
                  Effect.catchCause(cause =>
                      Effect.sync(() => {
                          showErrorToast(t`Could not read CSV file`, getErrorMessage(Cause.squash(cause)));
                          router.back();

                          return EMPTY_IMPORT_CSV;
                      })
                  )
              )
            : Effect.succeed(EMPTY_IMPORT_CSV)
    )
);
