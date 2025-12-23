import Papa, { ParseResult } from 'papaparse';

export const parseCsvHeaders = (csvText: string): Promise<string[]> =>
    new Promise((resolve, reject) => {
        Papa.parse<Record<string, string>>(csvText, {
            header: true,
            preview: 1,
            complete: ({ meta }: ParseResult<Record<string, string>>) => void resolve(meta.fields ?? []),
            error: (error: Error) => void reject(error)
        });
    });

export const countCsvRows = (csvText: string): Promise<number> =>
    new Promise((resolve, reject) => {
        let count = 0;
        Papa.parse<Record<string, string>>(csvText, {
            header: true,
            skipEmptyLines: true,
            chunk: ({ data }: ParseResult<Record<string, string>>) => {
                count += data.length;
            },
            complete: () => void resolve(count),
            error: (error: Error) => void reject(error)
        });
    });
