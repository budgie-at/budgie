import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

export const WISE_STATEMENT = {
    EUR: 'statement_1000001_EUR_2022-01-01_2023-03-20.csv',
    USD: 'statement_1000002_USD_2022-01-01_2023-03-20.csv',
    GBP: 'statement_1000003_GBP_2022-01-01_2023-03-20.csv',
    HEADER_ONLY: 'statement_1000004_PLN_2022-01-01_2023-03-20.csv'
} as const;

export const readWiseStatement = (fileName: string): string => readFileSync(resolve(process.cwd(), 'src/fixtures/wise', fileName), 'utf8');
