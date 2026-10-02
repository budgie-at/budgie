import * as Effect from 'effect/Effect';
import Papa, { ParseResult } from 'papaparse';

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
