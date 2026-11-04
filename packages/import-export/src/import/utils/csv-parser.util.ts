import * as Effect from 'effect/Effect';
import Papa, { ParseResult } from 'papaparse';

import { isNotEmptyString } from '@rnw-community/shared';

export const parseCsvHeaders = (csvText: string) =>
    Effect.callback<string[], Error>(resume => {
        Papa.parse<Record<string, string>>(csvText, {
            header: true,
            preview: 1,
            complete: ({ meta }: ParseResult<Record<string, string>>) => void resume(Effect.succeed(meta.fields ?? [])),
            error: (error: Error) => void resume(Effect.fail(error))
        });
    });

export const countCsvRows = (csvText: string) =>
    Effect.callback<number, Error>(resume => {
        let count = 0;
        Papa.parse<Record<string, string>>(csvText, {
            header: true,
            skipEmptyLines: true,
            chunk: ({ data }: ParseResult<Record<string, string>>) => {
                count += data.length;
            },
            complete: () => void resume(Effect.succeed(count)),
            error: (error: Error) => void resume(Effect.fail(error))
        });
    });

export const parseCsvSample = (csvText: string) =>
    Effect.callback<Record<string, readonly string[]>, Error>(resume => {
        Papa.parse<Record<string, string>>(csvText, {
            header: true,
            skipEmptyLines: true,
            complete: ({ data, meta }: ParseResult<Record<string, string>>) => {
                const samples: Record<string, readonly string[]> = {};

                for (const header of meta.fields ?? []) {
                    samples[header] = data
                        .map(row => row[header])
                        .filter(isNotEmptyString)
                        .map(value => value.trim())
                        .filter(isNotEmptyString);
                }

                resume(Effect.succeed(samples));
            },
            error: (error: Error) => void resume(Effect.fail(error))
        });
    });
